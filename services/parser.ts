import Papa from 'papaparse';
import { ChatLog, ProcessedTrade, TradeStatus, PortfolioRow } from '../types';

// Helper to clean currency strings (e.g. "$1,234.56" -> 1234.56)
// Also handles accounting format for negative numbers: ($10.50) -> -10.50
const cleanFloat = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let str = String(val).trim();
  
  // Check for accounting format (surrounded by parentheses)
  const isAccountingNegative = str.startsWith('(') && str.endsWith(')');
  
  // Remove non-numeric chars except dot and minus
  str = str.replace(/[^0-9.-]/g, ''); 
  
  let num = parseFloat(str);
  if (isNaN(num)) return 0;
  
  if (isAccountingNegative) {
      num = -1 * Math.abs(num);
  }
  
  return num;
};

// Helper to normalize CSV headers
const transformHeader = (header: string) => {
  const h = header.trim();
  const lower = h.toLowerCase();
  
  // Standardize common fields
  if (lower === 'category') return 'Category';
  if (lower === 'slug') return 'slug';
  if (lower === 'title') return 'title';
  if (lower === 'outcome') return 'outcome';
  if (lower === 'side') return 'side';
  if (lower === 'timestamp') return 'timestamp';
  if (lower === 'price') return 'price';
  if (lower === 'curprice' || lower === 'cur price') return 'curPrice'; // New field mapping
  if (lower === 'size') return 'size';
  if (lower === 'usdcsize' || lower === 'usdc size') return 'usdcSize';
  if (lower === 'avgprice' || lower === 'avg price') return 'avgPrice';
  if (lower === 'currentvalue' || lower === 'current value') return 'currentValue';
  if (lower === 'cashpnl' || lower === 'cash pnl') return 'cashPnl';
  if (lower === 'realizedpnl' || lower === 'realized pnl') return 'realizedPnl';
  return h;
};

export const parseInputData = (portfolioCsv: string, chatCsv: string) => {
  const parseOptions = {
    header: true,
    dynamicTyping: false, // We will manually clean numbers
    skipEmptyLines: true,
    transformHeader
  };

  // Parse Consolidated Portfolio CSV
  const portfolioRaw = Papa.parse<any>(portfolioCsv, parseOptions).data;
  
  const activePositions: PortfolioRow[] = [];
  const closedPositions: PortfolioRow[] = [];
  const activityHistory: PortfolioRow[] = [];

  portfolioRaw.forEach((row: any) => {
    // Clean numeric fields
    row.size = cleanFloat(row.size);
    row.avgPrice = cleanFloat(row.avgPrice);
    row.currentValue = cleanFloat(row.currentValue);
    row.cashPnl = cleanFloat(row.cashPnl);
    row.realizedPnl = cleanFloat(row.realizedPnl);
    row.usdcSize = cleanFloat(row.usdcSize);
    row.price = cleanFloat(row.price);
    row.curPrice = cleanFloat(row.curPrice); // Clean new field
    row.timestamp = row.timestamp ? parseInt(row.timestamp) : undefined;

    const cat = row.Category ? row.Category.toUpperCase() : '';

    if (cat.includes('OPEN_POSITION')) {
        activePositions.push(row);
    } else if (cat.includes('CLOSED_POSITION')) {
        closedPositions.push(row);
    } else if (cat.includes('ACTIVITY_HISTORY')) {
        activityHistory.push(row);
    }
  });

  // Parse Chat Logs
  const chatLogs = Papa.parse<ChatLog>(chatCsv, { 
    header: true, 
    dynamicTyping: false, 
    skipEmptyLines: true 
  }).data;

  return { activePositions, closedPositions, activityHistory, chatLogs };
};

const extractTraderName = (content: string): string => {
  const match = content.match(/\*\*([^*]+)\*\*/);
  return match ? match[1].trim() : 'Unknown Trader';
};

const simplify = (str: string | undefined | null) => {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const getFailureReason = (line: string): string | null => {
    if (!line) return null;
    if (line.includes('Insufficient USDC balance')) return 'Insufficient Balance';
    if (line.includes('Market odds too high') || line.includes('Market odds too low')) return 'Odds Limit Exceeded';
    if (line.includes('Market liquidity too low')) return 'Low Liquidity';
    if (line.includes('Would exceed max spend limit')) return 'Max Spend Limit';
    if (line.includes('Balance too small to sell')) return 'Balance Too Small';
    if (line.includes('Order status: delayed')) return 'Delayed/Retrying';
    if (line.includes('Failed to buy')) return 'Generic Failure';
    return null;
};

const parseTradeDetails = (line: string, nextLine: string | undefined) => {
  const result = {
    action: 'Unknown' as 'BUY' | 'SELL' | 'Unknown',
    outcome: '',
    amount: 0,
    marketTitle: '',
    marketUrl: '',
    marketSlug: '',
    status: TradeStatus.SUCCESS,
    failureReason: ''
  };

  const tradeRegex = /(BUY|SELL)[:\s]+(?:["']?([^"'$]+)["']?)?\s+\$([0-9,.]+)/i;
  const tradeMatch = line.match(tradeRegex);

  if (tradeMatch) {
    result.action = tradeMatch[1].toUpperCase() as 'BUY' | 'SELL';
    result.outcome = tradeMatch[2] ? tradeMatch[2].trim() : '';
    result.amount = cleanFloat(tradeMatch[3]);
  }
  
  if (!result.outcome) {
      const simpleMatch = line.match(/(BUY|SELL)\s+(.*?)\s+\$/i);
      if (simpleMatch) result.outcome = simpleMatch[2].trim();
  }

  const linkRegex = /\[([^\]]+)\]\((https:\/\/polymarket\.com\/(?:market|event)\/([^)\s]+))\)/;
  const linkMatch = line.match(linkRegex);

  if (linkMatch) {
    result.marketTitle = linkMatch[1];
    result.marketUrl = linkMatch[2];
    let extractedSlug = linkMatch[3];
    if (extractedSlug.includes('?')) extractedSlug = extractedSlug.split('?')[0];
    if (extractedSlug.includes('#')) extractedSlug = extractedSlug.split('#')[0];
    result.marketSlug = extractedSlug;
  }

  if (line.includes('⏭️') || line.includes('✗')) {
      result.status = TradeStatus.FAILED;
      const reason = getFailureReason(line);
      if (reason) result.failureReason = reason;
      else if (line.includes('⏭️')) result.failureReason = 'Skipped';
      else result.failureReason = 'Execution Failed';
  }

  if (nextLine) {
      const nextLineReason = getFailureReason(nextLine);
      if (nextLineReason) {
          result.status = TradeStatus.FAILED;
          result.failureReason = nextLineReason;
      }
  }

  return result;
};

export const processTrades = (
  chatLogs: ChatLog[],
  activePositions: PortfolioRow[],
  closedPositions: PortfolioRow[],
  activityHistory: PortfolioRow[]
): ProcessedTrade[] => {
  const processed: ProcessedTrade[] = [];
  const usedActivityIds = new Set<number>();

  chatLogs.forEach((log, logIndex) => {
    if (!log.content.match(/(BUY|SELL)/i) && !log.content.includes('http')) return;
    if (log.content.includes('Your Polymarket Portfolio')) return;

    const lines = log.content.split('\n');
    const traderName = extractTraderName(log.content);
    const logDate = new Date(log.date);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.match(/(BUY|SELL)/i)) continue;

        const nextLine = lines[i + 1];
        const details = parseTradeDetails(line, nextLine);
        
        if (!details.marketSlug && !details.marketTitle) continue;

        let matchedStatus: 'Active' | 'Closed' | 'None' = 'None';
        let pnl = undefined;
        let currentValue = undefined;
        let matchedTxHash = undefined;
        let matchedExecutionPrice = undefined;
        let matchedExecutionAmount = undefined;
        let shares = undefined;
        let latencySeconds = undefined;
        let matchConfidence: 'Exact (Activity)' | 'Inferred (Position)' | 'None' = 'None';
        let closedDate = undefined;
        let result: 'WIN' | 'LOSS' | 'OPEN' | undefined = undefined;

        if (details.status === TradeStatus.SUCCESS) {
            const simpleSlug = simplify(details.marketSlug);
            const simpleSide = details.action.toUpperCase();
            const simpleOutcome = simplify(details.outcome); // e.g. "yes" or "no"

            const tradeTime = logDate.getTime() / 1000;

            let bestActivityIndex = -1;
            let minTimeDiff = 3600; // Allow 1 hour window

            activityHistory.forEach((h, idx) => {
                if (usedActivityIds.has(idx)) return;
                
                // Match Side (BUY/SELL)
                if (h.side?.toUpperCase() !== simpleSide) return;

                // Match Slug
                const hSlug = simplify(h.slug);
                if (!hSlug.includes(simpleSlug) && !simpleSlug.includes(hSlug)) return;

                // Match Time
                const activityTime = h.timestamp || 0;
                const diff = Math.abs(activityTime - tradeTime);

                // Find closest match within window
                if (diff < minTimeDiff) {
                    const hOutcome = simplify(h.outcome);
                    // Ensure activity outcome matches trade outcome (e.g. Yes matches Yes)
                    if (hOutcome && simpleOutcome && (hOutcome === 'yes' || hOutcome === 'no') && (simpleOutcome === 'yes' || simpleOutcome === 'no')) {
                         if (hOutcome !== simpleOutcome) return;
                    }

                    minTimeDiff = diff;
                    bestActivityIndex = idx;
                }
            });

            if (bestActivityIndex !== -1) {
                usedActivityIds.add(bestActivityIndex);
                const activityMatch = activityHistory[bestActivityIndex];
                
                matchConfidence = 'Exact (Activity)';
                matchedTxHash = activityMatch.transactionHash;
                
                const entryPrice = activityMatch.avgPrice || activityMatch.price || 0;
                const tradeShares = activityMatch.size || 0;
                
                matchedExecutionPrice = entryPrice;
                matchedExecutionAmount = activityMatch.usdcSize || (entryPrice * tradeShares);
                shares = tradeShares;
                
                if (activityMatch.timestamp) {
                    latencySeconds = activityMatch.timestamp - tradeTime;
                }

                const assetId = activityMatch.asset;

                // --- MATCHING ACTIVE OR CLOSED POSITION ---
                const isMatchingPosition = (p: PortfolioRow) => {
                    const pSlug = simplify(p.slug);
                    const pOutcome = simplify(p.outcome);
                    
                    // 1. Asset Match (Strongest)
                    if (assetId && p.asset === assetId) return true;

                    // 2. Slug Match (Weaker) - Must also check Outcome
                    if (p.slug && (pSlug.includes(simpleSlug) || simpleSlug.includes(pSlug))) {
                        // If outcomes are defined, they MUST match
                        if (pOutcome && simpleOutcome) {
                            if (pOutcome === simpleOutcome) return true;
                            // If mismatched outcomes, return false
                            return false; 
                        }
                        // If outcome is missing in position row, we assume match (risky but needed fallback)
                        return true;
                    }
                    return false;
                };
                
                const activePos = activePositions.find(isMatchingPosition);
                
                if (activePos) {
                    matchedStatus = 'Active';
                    result = 'OPEN';
                    // Active Position Valuation
                    const currentPrice = activePos.price || (activePos.currentValue && activePos.size ? activePos.currentValue / activePos.size : 0);
                    pnl = (currentPrice - entryPrice) * tradeShares;
                    currentValue = currentPrice * tradeShares;
                } else {
                    const closedPos = closedPositions.find(isMatchingPosition);
                    if (closedPos) {
                        matchedStatus = 'Closed';
                        if (closedPos.date) closedDate = closedPos.date;

                        // PnL Logic for Closed/Settled Positions:
                        // 1. Prefer explicit settlement price (curPrice) which is usually 0 or 1.
                        // 2. Fallback to Price if available.
                        // 3. Fallback to Realized PnL to deduce direction.
                        
                        let exitPrice = 0;
                        const posCurPrice = closedPos.curPrice;
                        const posPrice = closedPos.price;
                        const realizedPnl = closedPos.realizedPnl || 0;
                        const posValue = closedPos.currentValue;
                        const posSize = closedPos.size;

                        // Priority 1: Use explicit curPrice (from new CSV format)
                        if (posCurPrice !== undefined) {
                             exitPrice = posCurPrice;
                             result = exitPrice > 0.5 ? 'WIN' : 'LOSS';
                        }
                        // Priority 2: Use explicit Price if available and resembles binary (0 or 1)
                        else if (posPrice !== undefined && (posPrice > 0.9 || posPrice < 0.1)) {
                             exitPrice = posPrice > 0.9 ? 1 : 0;
                             result = exitPrice === 1 ? 'WIN' : 'LOSS';
                        } 
                        // Priority 3: Use Value / Size Ratio (Strong Indicator for Settled Positions)
                        else if (posSize && posValue !== undefined) {
                            const ratio = Math.abs(posSize) > 0 ? posValue / Math.abs(posSize) : 0;
                            if (ratio > 0.9) {
                                exitPrice = 1;
                                result = 'WIN';
                            } else if (ratio < 0.1) {
                                exitPrice = 0;
                                result = 'LOSS';
                            } else {
                                // Ambiguous ratio? Fallback to PnL
                                exitPrice = realizedPnl > 0 ? 1 : 0;
                                result = realizedPnl > 0 ? 'WIN' : 'LOSS';
                            }
                        }
                        // Priority 4: Fallback to PnL (Weakest but often correct for settled)
                        else {
                            if (realizedPnl > 0) {
                                exitPrice = 1; 
                                result = 'WIN';
                            } else {
                                exitPrice = 0;
                                result = 'LOSS';
                            }
                        }

                        pnl = (exitPrice - entryPrice) * tradeShares;
                        currentValue = exitPrice * tradeShares;
                    }
                }
            } else {
                // Inferred Position Match if no activity found
                const posMatch = activePositions.find(p => {
                    const pSlug = simplify(p.slug);
                    const pOutcome = simplify(p.outcome);
                    return pSlug.includes(simpleSlug) && (!pOutcome || !simpleOutcome || pOutcome === simpleOutcome);
                });

                if (posMatch) {
                    matchedStatus = 'Active';
                    matchConfidence = 'Inferred (Position)';
                    result = 'OPEN';
                } else {
                     details.status = TradeStatus.MISSING;
                     details.failureReason = 'No execution matched';
                }
            }
        }

        processed.push({
            id: `${logIndex}-${i}-${Math.random().toString(36).substr(2, 9)}`,
            date: log.date,
            closedDate: closedDate,
            traderName: traderName,
            action: details.action,
            outcome: details.outcome,
            amount: details.amount,
            marketTitle: details.marketTitle,
            marketSlug: details.marketSlug,
            marketUrl: details.marketUrl,
            status: details.status,
            failureReason: details.failureReason,
            matchedPositionStatus: matchedStatus,
            pnl: pnl,
            currentValue: currentValue,
            matchedTxHash,
            matchedExecutionPrice,
            matchedExecutionAmount,
            shares,
            latencySeconds,
            matchConfidence,
            result
        });
    }
  });

  return processed;
};

export const exportToCSV = (trades: ProcessedTrade[]) => {
  const csv = Papa.unparse(trades.map(t => ({
    Date: t.date,
    Trader: t.traderName,
    Action: t.action,
    Outcome: t.outcome,
    'Signal Amount': t.amount,
    'Exec Amount': t.matchedExecutionAmount || '',
    'Exec Price': t.matchedExecutionPrice || '',
    'Shares': t.shares || '',
    Market: t.marketTitle,
    Status: t.status,
    'Failure Reason': t.failureReason || '',
    'Matched Status': t.matchedPositionStatus,
    'Result': t.result || '',
    'Match Type': t.matchConfidence,
    'PnL': t.pnl ? t.pnl.toFixed(2) : '',
    'Current Value': t.currentValue ? t.currentValue.toFixed(2) : '',
    'Latency (s)': t.latencySeconds ? t.latencySeconds.toFixed(1) : '',
    'Tx Hash': t.matchedTxHash || '',
    Link: t.marketUrl
  })));

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'processed_trades_v3.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};