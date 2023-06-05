const Heading = ({ text }) => {
    return (
        <div style={{ 
            padding: "10px", 
            textAlign: "center", 
            backgroundColor: "#000", 
            borderBottom: "solid 0.5px gray", 
            height: "3vh" 
        }}>
            <span  className='heading-proctor'>{text}</span>
        </div>
    )
}

export default Heading