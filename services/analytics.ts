import { ProcessedTrade, AnalyticsResult, TraderStats, TimeSeriesPoint, TradeStatus } from '../types';

export const calculateAnalytics = (trades: ProcessedTrade[]): AnalyticsResult => {
    // 1. Calculate Attempts (using all trades)
    const attemptsByTrader: Record<string, number> = {};
    trades.forEach(t => {
        attemptsByTrader[t.traderName] = (attemptsByTrader[t.traderName] || 0) + 1;
    });

    // Filter for successful trades only for performance stats
    const successfulTrades = trades.filter(t => 
        t.status === TradeStatus.SUCCESS && 
        (t.matchedPositionStatus === 'Active' || t.matchedPositionStatus === 'Closed') &&
        t.pnl !== undefined
    );

    const tradesByTrader: Record<string, ProcessedTrade[]> = {};
    successfulTrades.forEach(t => {
        if (!tradesByTrader[t.traderName]) tradesByTrader[t.traderName] = [];
        tradesByTrader[t.traderName].push(t);
    });

    const traderStats: TraderStats[] = Object.keys(tradesByTrader).map(trader => {
        const tTrades = tradesByTrader[trader];
        const totalPnl = tTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const wins = tTrades.filter(t => (t.pnl || 0) > 0);
        const losses = tTrades.filter(t => (t.pnl || 0) <= 0);
        const winRate = tTrades.length > 0 ? (wins.length / tTrades.length) * 100 : 0;
        
        const grossWin = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));
        const profitFactor = grossLoss === 0 ? grossWin : grossWin / grossLoss;

        const longBets = tTrades.filter(t => t.outcome.toLowerCase() === 'yes').length;
        const shortBets = tTrades.filter(t => t.outcome.toLowerCase() === 'no').length;
        const longShortRatio = shortBets === 0 ? longBets : longBets / shortBets;

        const avgBet = tTrades.reduce((sum, t) => sum + (t.matchedExecutionAmount || 0), 0) / tTrades.length;
        
        const bestTrade = Math.max(...tTrades.map(t => t.pnl || 0));
        const worstTrade = Math.min(...tTrades.map(t => t.pnl || 0));

        // Avg Holding Time (Heuristic: ClosedDate - TradeDate)
        let totalHoldHours = 0;
        let holdCount = 0;
        tTrades.forEach(t => {
            const startDate = new Date(t.date).getTime();
            // If closed, use closedDate, else use now
            const endDate = t.closedDate ? new Date(t.closedDate).getTime() : Date.now();
            const hours = (endDate - startDate) / (1000 * 60 * 60);
            if (hours > 0) {
                totalHoldHours += hours;
                holdCount++;
            }
        });
        const avgHoldingTimeHours = holdCount > 0 ? totalHoldHours / holdCount : 0;

        // Freq
        const dates = tTrades.map(t => new Date(t.date).getTime());
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        const daysDiff = Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24));
        const avgTradesPerDay = tTrades.length / daysDiff;

        return {
            name: trader,
            totalPnl,
            winRate,
            profitFactor,
            avgHoldingTimeHours,
            longShortRatio,
            avgTradesPerDay,
            totalAttempts: attemptsByTrader[trader] || 0,
            bestTrade,
            worstTrade,
            avgSuccessfulBet: avgBet // Using executed amount as proxy
        };
    });

    // 2. Overall Time Series
    // Sort all successful trades by date
    const sortedTrades = [...successfulTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let runningPnl = 0;
    let winCount = 0;
    let totalCount = 0;

    const overallTimeSeries: TimeSeriesPoint[] = sortedTrades.map((t, index) => {
        runningPnl += (t.pnl || 0);
        if ((t.pnl || 0) > 0) winCount++;
        totalCount++;
        
        return {
            date: new Date(t.date).toLocaleDateString(),
            timestamp: new Date(t.date).getTime(),
            value: runningPnl,
            winRate: (winCount / totalCount) * 100
        };
    });

    // 3. Per Trader Time Series (Cumulative)
    const pnlOverTimeByTrader: TimeSeriesPoint[] = [];
    const winRateOverTimeByTrader: TimeSeriesPoint[] = [];

    Object.keys(tradesByTrader).forEach(trader => {
        const tTrades = tradesByTrader[trader].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let tPnl = 0;
        let tWins = 0;
        let tCount = 0;

        tTrades.forEach(t => {
            tPnl += (t.pnl || 0);
            if ((t.pnl || 0) > 0) tWins++;
            tCount++;

            const pt = {
                date: new Date(t.date).toLocaleDateString(),
                timestamp: new Date(t.date).getTime(),
                trader: trader,
                value: 0
            };

            pnlOverTimeByTrader.push({ ...pt, value: tPnl });
            winRateOverTimeByTrader.push({ ...pt, value: (tWins / tCount) * 100 });
        });
    });

    // 4. Daily Trade Counts (Discrete)
    const dailyCountsMap: Record<number, Record<string, number>> = {};
    
    successfulTrades.forEach(t => {
        const d = new Date(t.date);
        d.setHours(0, 0, 0, 0); // Normalize to start of day
        const ts = d.getTime();
        
        if (!dailyCountsMap[ts]) dailyCountsMap[ts] = {};
        dailyCountsMap[ts][t.traderName] = (dailyCountsMap[ts][t.traderName] || 0) + 1;
    });

    const dailyTradeCounts: TimeSeriesPoint[] = [];
    Object.entries(dailyCountsMap).forEach(([tsStr, traderCounts]) => {
        const ts = parseInt(tsStr);
        Object.entries(traderCounts).forEach(([trader, count]) => {
             dailyTradeCounts.push({
                date: new Date(ts).toLocaleDateString(),
                timestamp: ts,
                value: count,
                trader: trader
             });
        });
    });

    return {
        traderStats,
        overallTimeSeries,
        pnlOverTimeByTrader,
        winRateOverTimeByTrader,
        dailyTradeCounts
    };
};