import React, { useEffect, useRef, useState } from 'react';
import queryString from 'query-string';
import { useLocation, useNavigate } from 'react-router-dom';
import './news.scss';

function Popup(props) {
    return (<div className={props.view ? 'popup view' : 'popup'}>
        {props.view == true ? null : <div onClick={(e)=> props.setView(false)} className={'exit'}>X</div>}
        <div>{props.view == true ? (<div class="circle"></div>) : props.view}</div>
    </div>)
}


export default function App() {
    let [data, setData] = useState([]);
    let [view, setView] = useState(false);
    let location = useLocation()
    const params = queryString.parse(location.search);

    useEffect(() => {
        // setData([]);
        fetch('http://localhost:3000/api/news' + location.search).then(res => res.json()).then(data => {
            setData(data.hits.hits.map(x => {
                const result = x._source;
                result.id = x._id;
                return result
            }));
        }).catch(err => console.log(err));
    }, [location.search])

    const summarization = (text) => {
        return (e) => {
            setView(true);
            fetch('http://localhost:3000/api/summarization', {
                method: 'POST',
                body: JSON.stringify({
                    data: text
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(res => res.json()).then(data => {
                setView(data.data);
            })
        }
    }

    const lists = data.map(x => {
        return <li key={x.id}>
            <div className='status'>
                <span>
                    <img src={'/happy.png'} />
                    <div className={'emotion'}>좋아요</div>
                    <div className={'count'}>{x.comments_sentiment_good}</div>
                </span>
                <span>
                    <img src={'/angry.png'} />
                    <div className={'emotion'}>싫어요</div>
                    <div className={'count'}>{x.comments_sentiment_bad}</div>
                </span>
            </div>
            <div className="title">
                <div><a href={x.url}>{x.title}</a></div>
                <div className={'description'}>
                    <div className="comments">댓글: {x.comments_size}</div>
                    <button onClick={summarization(x.text)}>본문 요약</button>
                </div>
            </div>
        </li>
    })

    return (
        <div className={"news"}>
            <Popup view={view} setView={setView} />
            <ul>{lists}</ul>
        </div>
    );
}