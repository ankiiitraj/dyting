/* eslint-disable */

import { useState, useEffect, useRef } from 'react';
import { DyteMeeting, provideDyteDesignSystem } from '@dytesdk/react-ui-kit';
import { useDyteClient } from '@dytesdk/react-web-core';
import Proctor from './Proctor';
import Heading from './Heading';
import {SendImageToBackendMiddleware, joinMeeting} from './utils' 
// Constants
const SERVER_URL = process.env.SERVER_URL || "http://localhost:8000"
let LAST_BACKEND_PING_TIME = 0;
const DETECT_FACES_ENDPOINT = `${SERVER_URL}/detect_faces`;
const TIME_BETWEEN_BACKEND_PINGS = 2000;

const Meet = () => {
    const meetingEl = useRef();
    const [meeting, initMeeting] = useDyteClient();
    const [userToken, setUserToken] = useState();
    const [isAdminBool, setAdminBool] = useState(null);
    const meetingId = window.location.pathname.split('/')[2]

    function SendImageToBackendMiddleware() {
        return async (canvas, ctx) => {
            const currentTime = Date.now();            
            if (currentTime - LAST_BACKEND_PING_TIME > TIME_BETWEEN_BACKEND_PINGS) {
                LAST_BACKEND_PING_TIME = currentTime;
                const imgBase64String = canvas.toDataURL('image/png');
                const response = await fetch(DETECT_FACES_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        base64_img: imgBase64String,
                        participant_id: meeting?.self.id,
                        participant_name: meeting?.self.name,
                        meeting_id: meetingId
                    }),
                });
                const res = await response.json();
                if (res['multiple_detected']) {
                    console.log('Warning: Multiple faces detected!');
                    sendNotification({
                        id: 'multiple_faces_detected',
                        message: 'Warning: Multiple faces detected!',
                    });
                }
            }
        };
    }

    const isAdmin = async (id) => {
        const res = await fetch(`${SERVER_URL}/is_admin`, {
            method: "POST",
            body: JSON.stringify({ admin_id: window.localStorage.getItem("adminId") || '', meeting_id: meetingId || '' }),
            headers: { "Content-Type": "application/json" }
        })
        const resJson = await res.json()
        setAdminBool(resJson.admin)
    }

    const joinMeetingId = async () => {
        if (meetingId) {
            const authToken = await joinMeeting(meetingId)
            await initMeeting({
                authToken,
            });
            setUserToken(authToken)
        }
    }

    useEffect(() => {
        if (meetingId && !userToken) joinMeetingId()
        isAdmin()
    }, [])

    useEffect(() => {
        if (userToken) {
            provideDyteDesignSystem(meetingEl.current, {
                theme: 'dark'
            });
        }
    }, [userToken])
    
    useEffect(() => {
        if(isAdminBool === false && meeting?.self) {
            meeting.self.addVideoMiddleware(SendImageToBackendMiddleware);
        }
    }, [meeting?.self])

    return (
        <div style={{ height: "96vh", width: "100vw", display: "flex" }}>
            { userToken && 
                <>
                    {isAdminBool && <div style={{ width: "40vw", height: "100vh", overflowY: "scroll", backgroundColor: "black", borderRight: "solid 0.5px gray" }}><Heading text={"Proctoring Information"} /><Proctor meeting={meeting} /></div>}
                    {isAdminBool ? <div style={{ width: "60vw", height: "96vh" }}><Heading text={"Proctoring Admin Interface"} /><DyteMeeting mode='fill' meeting={meeting} ref={meetingEl} /></div> : <div style={{ width: "100vw", height: "96vh" }}><Heading text={"Proctoring Candidate Interface"} /><DyteMeeting mode='fill' meeting={meeting} ref={meetingEl} /></div>}
                </>
            }
        </div>
    )
}

export default Meet