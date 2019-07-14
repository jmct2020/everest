const BotIndicator = require('./BotIndicator')
const BotTrade = require('./BotTrade')

function BotStrategy(bot)
{
  this.bot = bot
  this.prices = []
  this.closes = []
  this.trades = []
  this.currentPrice = 0
  this.currentClose = 0
  this.numSimulTrades = 1
  this.log = this.bot.log
  this.indicators = new BotIndicator()
}

BotStrategy.prototype.tick = function(candlestick)
{
  this.currentPrice = candlestick.priceAverage
  this.prices.push(this.currentPrice)
  this.bot.log("Price: " + candlestick.priceAverage + "\tMoving Average: " + this.indicators.movingAverage(this.prices, 15))
  this.evaluatePositions()
  this.updateOpenTrades()
  this.showPositions()
}

BotStrategy.prototype.evaluatePositions = function()
{
  let openTrades = []

  this.trades.forEach(trade => {
    if(trade.status == "OPEN")
      openTrades.push(trade)
  })

  if(openTrades.length < this.numSimulTrades)
    if(this.currentPrice < this.indicators.movingAverage(this.prices,15))
      this.trades.push(new BotTrade(this.currentPrice, 0.0001))

  openTrades.forEach(trade => {
    if(this.currentPrice > this.indicators.movingAverage(this.prices, 15))
      trade.close(this.currentPrice)
  })
}

BotStrategy.prototype.updateOpenTrades = function()
{
  for(let trade in this.trades)
  {
    if(trade.status == "OPEN")
      trade.tick(this.currentPrice)
  }
}

BotStrategy.prototype.showPositions = function()
{
  this.trades.forEach(trade => {
    trade.showTrade()
  })
}

module.exports = BotStrategy
