
import star from "/star.svg"
import RevealText from "./RevealText"

const ProjectBigText = ({ text1=null, text2, text3, points=null }) => {

    const containerStyle = {
        width: "100%",
        height: "max-content",
        paddingTop: "30px",
        paddingLeft: "30px",
        paddingRight: "30px",
        boxSizing: "border-box",
        borderRadius: "9px",
        backgroundColor: "var(--off-white)",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        paddingBottom: text1 == "REFLECTIONS" ? "90px" : "30px"
    };

    const textStyle1 = {
        width: "100%",
        fontSize: "15px",
        fontWeight: "400",
        color: "var(--off-black-06)",
        fontFamily: "'Stara', san-serif",
        margin: "0",
        textWrap: "wrap"
    }

    const textStyle2 = {
        width: "100%",
        fontSize: "36px",
        fontWeight: "500",
        color: "var(--off-black)",
        fontFamily: "'Lora', serif",
        margin: "0",
        textWrap: "wrap"
    }

        const textStyle3 = {
        width: "100%",
        fontSize: "15px",
        fontWeight: "400",
        color: "var(--off-black-06)",
        fontFamily: "'Stara', san-serif",
        margin: "0",
        textWrap: "wrap"
    }

    const pointStyle = {
        width: "100%",
        fontSize: "15px",
        fontWeight: "400",
        color: "var(--off-black-06)",
        fontFamily: "'Stara', san-serif",
        margin: "0",
        textWrap: "wrap",
        display: "flex",
        gap: "9px",
        alignItems: "start",
    }

    const starWrapper = {
        height: "21px",
        display: "flex",
        alignItems: "center",
        flex: "0"
    }

    return (
        <div style={containerStyle}>
            <h1 style={textStyle1}>{text1}</h1>
            <RevealText
                as="h1"
                style={textStyle2}
                text={text2}
                rootMargin="0px"
                threshold={0}
            />
            <h1 style={textStyle3}>{text3}</h1>
            {   points !== null &&
                points.map((item, index) => (
                    <div style={pointStyle} key={index}>
                        <div style={starWrapper}><img src={star} alt="" /></div>
                        {item}
                    </div>
                ))
            }
        </div>
    );
};

export default ProjectBigText;
