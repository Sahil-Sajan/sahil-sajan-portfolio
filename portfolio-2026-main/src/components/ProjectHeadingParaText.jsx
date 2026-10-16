import RevealText from "./RevealText";

const ProjectHeadingParaText = ({ heading, para, headingcolor="var(--off-black)" }) => {

    const containerStyle = {
        width: "100%",
        height: "max-content",
        padding: "30px",
        boxSizing: "border-box",
        borderRadius: "9px",
        backgroundColor: "var(--off-white)",
        display: "flex",
        justifyContent: "start",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "6px"
    };

    const headingStyle = {
        width: "100%",
        fontSize: "30px",
        fontWeight: "600",
        color: headingcolor,
        margin: "0",
        textWrap: "wrap"
    }

    const spanStyle = {
        color: "var(--dark-green)"
    }

    const paraStyle = {
        width: "100%",
        fontSize: "15px",
        fontWeight: "500",
        color: "var(--off-black)",
        margin: "0",
        textWrap: "wrap",
        lineHeight: "1.6"
    }

    return (
        <div style={containerStyle}>
            <RevealText
                as="h3"
                style={headingStyle}
                text={heading}
                trail={{ text: ".", style: spanStyle }}
            />
            <h3 style={paraStyle}>{para}</h3>
        </div>
    );
};

export default ProjectHeadingParaText;
