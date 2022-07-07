const express = require('express');
const router = express.Router();
const axios = require('axios');

const { Client } = require('@elastic/elasticsearch');
const client = new Client({
    node: ['http://175.196.244.121:9200'],
    auth: {
        username: 'elastic',
        password: 'appleBanana'
    }
})

function getDate(params) {
    let min_year = params.year*1 || 2020;
    let max_year = !params.year ? 2023 :
        !params.month || params.month == 12 ? min_year + 1 : min_year;
    let min_month = params.month*1 || 1;
    let max_month = !params.month || params.month == 12 ? 1 : min_month + 1;
    min_year = min_year.toString();
    max_year = max_year.toString();
    min_month = min_month.toString().padStart(2, '0');
    max_month = max_month.toString().padStart(2, '0');
    let interval = !params.year ? 'year' : !params.month ? 'month' : 'day';
    return [`${min_year}-${min_month}-01T00:00:00+0900`, `${max_year}-${max_month}-01T00:00:00+0900`, interval]
}


async function match(params) {
    let [gte, lt, interval] = getDate(params);

    const body = {
        size:0,

        query: {
            bool: {
                filter: [
                    {
                        range: {
                            "date": { gte, lt }
                        }
                    },
                    {
                        simple_query_string: {
                            query: `${params.keyword}`,
                            fields: ['title', 'text']
                        }
                    }
                ]
            }
        },

        aggs: {
            "comments": {
                nested: {
                    path: "comments"
                },
                aggs: {
                    "keyword": {
                        terms: {
                            field: "comments.text",
                            size: 40
                        },
                        aggs: {
                          "sentiment": {
                            terms: {
                              field: "comments.sentiment_result"
                            }
                          }
                        }
                    }
                }
            },
            "date": {
                date_histogram: {
                    field: "date",
                    calendar_interval: interval,
                    time_zone: "+09:00"
                },
                aggs: {
                    "comments": {
                        nested: {
                            path: "comments"
                        },
                        aggs: {
                            "sentiment": {
                                terms: {
                                    field: "comments.sentiment_result"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    try {
        const result = await client.search({
            index: 'article-all',
            body
        });
        return result
    } catch (err) {
        console.log('wrong query');
        console.log(err);
        return {'error': 'wrong query'};
    }
}

async function sort(params) {
    let [gte, lt, interval] = getDate(params);

    // 본문
    const body = {
        size:10,
        _source: ["text", "title", "url", "comments_size", "comments_sentiment_good", "comments_sentiment_bad"],
        query: {
            range: {
                date: {
                    gte,
                    lt
                }
            }
        }, 
        sort: [
            {
                comments_size: {
                order: "desc"
            }
        }]
    }

    // 요청
    try {
        const result = await client.search({
            index: 'article-all',
            body
        });
        return result
    } catch (err) {
        console.log('wrong query');
        return {'error': 'wrong query'};
    }
}

// 검색
router.get('/keyword', async (req, res, next) => {
    params = req.query
    result = await match(params);
    res.json(result);
});

// 뉴스 목록
router.get('/news', async (req, res, next) => {
    params = req.query
    result = await sort(params);
    res.json(result);
})

// 본문 요약
router.post('/summarization', async (req, res, next) => {
    console.log('본문 요약 시작');
    axios.post('http://121.148.210.97:5000/summary', {
        body: {data: req.body.data},
    }).then(response => {
        res.json({data: response.data.data});
    }).catch(err => {
        console.log(err.code);
        res.json({data: 'error'});
    });
})

module.exports = router;
