import './chart.scss';
import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
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
    console.log(graph);
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
        fetch('http://localhost:3000/api/keyword' + location.search).then(res => res.json()).then(data => {
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
            let date = e[0].element.$context.raw.x;
            const interval = {'년': 'year', '월': 'month'}[date.slice(-1)];
            if (interval.length) {
                params[interval] = date.slice(0,-1)
                const query = queryString.stringify(params);
                navigate(`/search/chart/?${query}`);
            }
        }
    }
    
    const wordsOptions = {
        rotations: 0,
        fontSizes: [10, 50],
        fontFamily: 'Jua',
        padding: 1,
    };

    const graphOptions = {
        responsive: true,
    }

    return (
        <div className='chart'>
            <div className='wordcloud'>
                <ReactWordcloud 
                    callbacks={wordsCallbacks}
                    options={wordsOptions}
                    size={[400, 400]}
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