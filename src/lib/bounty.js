export function chipSplit(bounty, minChip) {
  const half = bounty / 2
  const pocket = Math.min(Math.ceil(half / minChip) * minChip, bounty)
  const onHead = Math.round((bounty - pocket) * 100) / 100
  return { pocket: Math.round(pocket * 100) / 100, onHead }
}

export function r2(n) {
  return Math.round(n * 100) / 100
}
