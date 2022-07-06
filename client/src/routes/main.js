import './main.scss';
import { useNavigate, Outlet, useLocation} from "react-router-dom";
import queryString from 'query-string';

export default function Search() {
    let navigate = useNavigate();
    let location = useLocation()
    const query = queryString.parse(location.search);

    const handleSubmit = (e) => {
        const keyword = e.target.keyword.value;
        e.preventDefault();
        navigate(`/search/chart/?keyword=${keyword}`);
    }

    return (
        <div className='main'>
            <div className='search-wrap'>
                <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
                <form onSubmit={handleSubmit}>
                    <input autoComplete='off' name='keyword' className='search-bar' placeholder='검색어를 입력하세요' key={query.keyword} defaultValue={query.keyword}></input>
                </form>
            </div>
            <Outlet />
        </div>
    );
}