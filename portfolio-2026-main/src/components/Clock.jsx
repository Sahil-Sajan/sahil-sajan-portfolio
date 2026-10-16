import { useState, useEffect } from "react";

function Clock() {
  const getPakistanTime = () =>
    new Date().toLocaleTimeString([], {
      timeZone: "Asia/Karachi", // Pakistan Standard Time (PKT)
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const [time, setTime] = useState(getPakistanTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getPakistanTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <span style={{paddingLeft: "9px"}}>{time}</span>;
}

export default Clock;
