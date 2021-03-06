const fs = require('fs');
const home = require('os').homedir()
const gChart = require('../assets/googleChartPieces')
const BotCandlestick = require('./BotCandlestick')
const BotIndicator = require('./BotIndicator')
const Poloniex = require('poloniex.js')
const colors = require('colors')

function Chart(bot)
{
  this.bot = bot
  this.indicators = new BotIndicator()
}

Chart.prototype.fetchHistoricalData = function()
{
  return new Promise((resolve, reject)=> {
    console.log('Fetching Historical Data...');
    this.bot.poloniex.returnChartData(this.bot.majorCurrency, this.bot.minorCurrency, this.bot.period, this.bot.startTime, this.bot.endTime)
    .then(res => {
      if(!res.error)
      {
        console.log('Success!');
        this.bot.historicalData = res
        this._saveCandlesticks(res)
        resolve()
      }
      else throw new Error(res.error)
    })
    .catch(err => { reject(err) })
  })
}

Chart.prototype.getCurrentPrice = function()
{
  return new Promise((resolve, reject)=>{
    this.bot.poloniex.returnTicker().then(data => {
      if (data[this.bot.currency])
        resolve(data[this.bot.currency].last)
      else
        throw new Error("Invalid Currency Pair!")
    }).catch(err => { reject(err) })
  })
}

Chart.prototype._saveCandlesticks = function(dataPoints)
{
  dataPoints.forEach(point => {
    if(point.open && point.close && point.high && point.low)
      this.bot.candlesticks.push(new BotCandlestick(this.bot, point.open, point.close, point.high, point.low, point.weightedAverage))
  })
}

Chart.prototype.generateChart = function()
{
  console.log('Generating Chart...');
  if(this.bot.historicalData.length > 0)
    this.createGoogleChart(this.bot.historicalData)
  else
    throw new Error("No Historical Data Available!")
}

Chart.prototype.createGoogleChart = function(historicalData)
{
  const chartHtml = this.getHtmlForGoogleChart(historicalData)
  this.writeChartDataToHtmlFile(chartHtml)
}

Chart.prototype.getHtmlForGoogleChart = function(historicalData)
{
  console.log('Generating Html File Data...');

  let nextDataPoint
  let lastPairPrice
  let dataDate
  let dataPoints = []
  let pointString = ``
  let done = false
  let numberOfSimilarLocalMaxes
  let temp = []

  while(!done)
  {
    if(historicalData.length > 0)
    {
        nextDataPoint = historicalData.pop()
        lastPairPrice = nextDataPoint.weightedAverage
        dataDate = new Date(nextDataPoint.date * 1000)
        temp.push(lastPairPrice)
    }
    else
    {
      dataPoints.forEach(point => {
        pointString += `['${point['date']}',${point['price']},${point['label']},${point['description']},${point['trend']}],\n`
      })
      done = true
      break;
    }

    dataPoints.push({
      date: dataDate,
      price: lastPairPrice,
      trend: this.indicators.movingAverage(temp, 15),
      label: 'null',
      description: 'null',

    })
  }
  return gChart.head + pointString + gChart.tail
}

Chart.prototype.writeChartDataToHtmlFile = function(chartHtml)
{
  console.log('Writing Chart Data To Html File...');
  fs.writeFile(`${home}/${this.bot.currency}-Chart.html`, chartHtml, function(err){
    if(err) throw new Error(err)
    console.log('Success!');
    console.log(`Chart saved to ${home}\\${this.bot.currency}-Chart.html`.yellow);
  }.bind(this))
}

Chart.prototype.getPoints = function()
{
  return this.bot.historicalData
}

module.exports = Chart
