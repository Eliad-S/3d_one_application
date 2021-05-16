import SpeechRecognition, {
    useSpeechRecognition,
  } from "react-speech-recognition";
  
const Dictaphone = ({ handleSpeech }) => {
    const commands = [
      {
        command: "capture",
        callback: () => {
          resetTranscript();
          handleSpeech("capture");
        },
        matchInterim: true,
      },
      {
        command: "doctor",
        callback: () => {
          resetTranscript();
          handleSpeech("capture");
        },
        matchInterim: true,
      },
    ];
    const { transcript, resetTranscript } = useSpeechRecognition({ commands });
  
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      return null;
    }
  
    SpeechRecognition.startListening({
      continuous: true,
      language: "en-US, he",
    });
    // if (transcript.localeCompare("capture") === 0) {
    //   console.log("im here")
    //   resetTranscript();
    // }
  
    // resetTranscript()
    // setInterval(resetTranscript(), 2000)
  
    return (
      <div>
        {/* <button onClick={SpeechRecognition.startListening}>Start</button> */}
        {/* <button onClick={SpeechRecognition.stopListening}>Stop</button> */}
        {/* <button onClick={resetTranscript}>Reset</button> */}
        {/* <p>{transcript}</p> */}
      </div>
    );
  };

export default Dictaphone