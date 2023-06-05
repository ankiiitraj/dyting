import { useEffect, useState } from 'react';
import Meet from './Meet';
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import './App.css'


function Home({ meetingId }) {
    return (
        <div style={{ height: "100vh", width: "100vw", fontSize: "x-large", display: "flex", justifyContent: "center", alignItems: "center"}}>
            {(meetingId && !window.location.pathname.split('/')[2]) && <Link to={`/meeting/${meetingId}`}>Create and Join Meeting</Link>}
        </div>
    )
}


function App() {
    const [meetingId, setMeetingId] = useState()

    const createMeeting = async () => {
        const res = await fetch("http://localhost:8000/meetings", {
            method: "POST",
            body: JSON.stringify({ title: "Joint Entrance Examination" }),
            headers: { "Content-Type": "application/json" }
        })
        const resJson = await res.json()
        window.localStorage.setItem("adminId", resJson.admin_id)
        setMeetingId(resJson.data.id)
    }

    useEffect(() => {
        const id = window.location.pathname.split('/')[2]
        if(!!!id) {
            createMeeting()
        }
    }, [])

    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Home meetingId={meetingId} />}></Route>
                <Route path='/meeting/:meetingId' element={<Meet />}></Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App;