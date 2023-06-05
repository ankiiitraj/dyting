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

const joinMeeting = async (id) => {
    const res = await fetch(`http://localhost:8000/meetings/${id}/participants`, {
        method: "POST",
        body: JSON.stringify({ name: "new user", preset_name: "group_call_host", meeting_id: meetingId }),
        headers: { "Content-Type": "application/json" }
    })
    const resJson = await res.json()
    const data = JSON.parse(resJson.detail)
    return data.data.token;
}

const getCandidateStatus = async () => {
    const response = await fetch("http://localhost:8000/multiple_faces_list", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            meeting_id: window.location.pathname.split('/')[2],
            admin_id: window.localStorage.getItem("adminId") || "undefined"
        })
    });
    const res = await response.json()
    if(res.details) return undefined
    return res
}

export {
    SendImageToBackendMiddleware,
    joinMeeting,
    getCandidateStatus
}