
const ProjectParaText = ({ text }) => {

    const containerStyle = {
        width: "100%",
        height: "max-content",
        padding: "30px",
        boxSizing: "border-box",
        borderRadius: "9px",
        backgroundColor: "var(--off-white)",
        display: "flex",
        justifyContent: "center"
    };

    const textStyle = {
        width: "100%",
        fontSize: "15px",
        fontWeight: "400",
        color: "var(--off-black-06)",
        margin: "0",
        textWrap: "wrap",
        lineHeight: "1.6"
    }

    return (
        <div style={containerStyle}>
            <h3 style={textStyle}>{text}</h3>
        </div>
    );
};

export default ProjectParaText;
