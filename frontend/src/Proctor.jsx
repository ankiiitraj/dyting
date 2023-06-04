import { useEffect, useState } from "react";



const Proctor = ({ meeting }) => {
    const [candidateStatuses, updateCandidateStatusState] = useState([])

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
        console.log(res)
        return res
    }

    const updateCandidateStatus = async () => {
        try {
            const res = await getCandidateStatus()
            updateCandidateStatusState(res)
        } catch(e) {
            setError("User don't have admin privileges.")
        }
    }

    useEffect(() => {
        updateCandidateStatus()
    }, [])

    useEffect(() => {
        if(candidateStatuses?.map) {
            const id = setInterval(() => {
                updateCandidateStatus()
            }, 20000)
            return () => {
                clearInterval(id)
            }
        }
    }, [candidateStatuses])

    return(
        <>
            <div style={{ padding: "0px 20px" }}>
                {candidateStatuses?.map && candidateStatuses ? candidateStatuses.map(status => 
                    <div style={{ display: "flex", justifyContent: "start", margin: "50px 20px" }}>
                        <div style={{ marginRight: "20px"}}>
                            <img src="https://images.yourstory.com/cs/images/companies/Dyte-1608553297314.jpg" style={{ borderRadius: "50px", height: "60px", border: "1px double lightblue" }} />
                        </div>
                        <div style={{ textAlign: "center", padding: "10px", backgroundColor: "#2160fd", fontSize: "x-large", fontWeight: "bold", borderRadius: "10px 10px 10px 10px", width: "50vw",  }} >
                            <div style={{ color: "white", padding: "20px 0px" }}>{status[4]}</div>
                            <img style={{ borderRadius: "10px" }} src={status[3]} />
                        </div>
                    </div>) : <div style={{ color: "white" }}>Wait or check if you have admin privileges to access the proctoring dashboard.</div>}
            </div>   
        </>
    )
}

export default Proctor;