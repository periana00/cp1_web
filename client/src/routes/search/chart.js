import './chart.scss';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactWordcloud from 'react-wordcloud';
import queryString from 'query-string';
import { Chart, getDatasetAtEvent  } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  registerables 
} from 'chart.js'
ChartJS.register(...registerables)

function getWords(data) {
    if ('aggregations' in data) {
        const THRESHOLD = 0.17;
        return data['aggregations']['comments']['keyword']['buckets'].map(bucket => {
            let doc_count = bucket.sentiment.buckets[0].doc_count
            doc_count = bucket.sentiment.buckets[0].key == '긍정' ? doc_count : bucket.doc_count - doc_count
            let sentiment = doc_count / bucket.doc_count / THRESHOLD * 0.5;
            sentiment = sentiment > 1 ? 1 : sentiment;
            return {
                text: bucket.key, 
                value: bucket.doc_count, 
                sentiment
            }
        });
    }
    return []
}

function getChartX(params, date) {
  const d = new Date(date);
  return !params.year ? d.getFullYear() + '년' : !params.month ? d.getMonth() + 1 + '월' : d.getDate() + '일';
}

function getGraph(params, data) {
    const graph = {
        datasets: [{
            type: 'line',
            label: params.month ? params.month + '월' : params.year ? params.year + '년' : '전체',
            borderColor: "#bae755",
            backgroundColor: "#55bae7",
            pointBackgroundColor: "#55bae7",
            pointBorderColor: "#55bae7",
            pointHoverBackgroundColor: "#55bae7",
            pointHoverBorderColor: "#55bae7",
            data: [],
        }]
    };
    if ('aggregations' in data) {
        graph.datasets[0].data = data['aggregations']['date']['buckets'].map(bucket => {
          let doc_size = bucket['comments']['doc_count'];
          let sentiment_size = 0;
          if (bucket['comments']['sentiment']['buckets'].length) {
              sentiment_size = bucket['comments']['sentiment']['buckets'][0]['doc_count'];
              sentiment_size = bucket['comments']['sentiment']['buckets'][0]['key'] == '긍정' ? sentiment_size : doc_size - sentiment_size;
          }
          return {x: getChartX(params, bucket['key_as_string']), y: sentiment_size / doc_size}
        })
    }
    return graph
}


export default function App() {
    // 필요한 변수들 정의
    let [data, setData] = useState([]);
    let location = useLocation()
    const params = queryString.parse(location.search);
    let navigate = useNavigate();
    let words = getWords(data);
    let graph = getGraph(params, data);
    let chartRef = useRef();

    useEffect(() => {
        setData([]);
        fetch('http://146.56.179.190:3000//api/keyword' + location.search).then(res => res.json()).then(data => {
        setData(data);
        console.log(data);
        }).catch(err => console.log(err));
    }, [location.search])

    const wordsCallbacks = {
        getWordColor: word => word.sentiment > 0.5 ? 'orange' : 'purple',
        onWordClick: word => {
            params.keyword = word.text;
            const query = queryString.stringify(params);
            navigate(`/search/chart/?${query}`);
        },
        // onWordMouseOver: console.log,
        getWordTooltip: word => `${word.value}개`,
    }

    const graphCallback = (e) => {
        e = getDatasetAtEvent(chartRef.current, e)
        if (e.length) {
            for (let i of e) {
                if (i.element.$context.active) {
                    let date = i.element.$context.raw.x;
                    const interval = {'년': 'year', '월': 'month'}[date.slice(-1)];
                    if (interval.length) {
                        params[interval] = date.slice(0,-1)
                        const query = queryString.stringify(params);
                        navigate(`/search/chart/?${query}`);
                    }
                }
            }
        }
    }
    
    const wordsOptions = {
        rotations: 0,
        fontSizes: [20, 60],
        fontFamily: 'Jua',
        padding: 5,
    };

    const graphOptions = {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                      return (value * 100).toFixed(2) + '%'; // convert it to percentage
                    },
                  },
                  scaleLabel: {
                    display: true,
                    labelString: 'Percentage',
                },
            }
        },
        plugins: {
            datalabels: {
                formatter: (value, ctx) => {
                    let sum = 0;
                    let dataArr = ctx.chart.data.datasets[0].data;
                    dataArr.map(data => {
                        sum += data;
                    });
                    let percentage = (value*100 / sum).toFixed(2)+"%";
                    return percentage;
                },
                color: '#aaa',
            }
        }
    }

    return (
        <div className='chart'>
            <div className='wordcloud'>
                {'aggregations' in data ? null : <div className="circle"></div>}
                <div className="status">
                    <div className={'orange'}>호감</div>
                    <div className={'purple'}>비호감</div>
                </div>
                <ReactWordcloud 
                    callbacks={wordsCallbacks}
                    options={wordsOptions}
                    size={[400, 500]}
                    words={words}
                />
            </div>
            <div className='line'>
                <Chart 
                    ref={chartRef}
                    data={graph} 
                    options={graphOptions} 
                    onClick={graphCallback}
                />
            </div>
        </div>
    );
}