import React, { useState, useEffect, useRef } from "react";
import restartIcon from "./images/restart_alt-white-24dp.svg";
import cancelIcon from "./images/clear-white-24dp.svg";
import addIcon from "./images/add-white-24dp.svg";
import loadingGIF from "./images/loading.gif";
import micIcon from "./images/mic-black-24dp.svg";
import Chart from "../node_modules/chart.js/dist/Chart.js";
import {SpeechRecognition, useSpeechRecognition} from "react-speech-recognition";

export default class ScanScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentlyScanning: false,
      connectedToServer: false,
      settings: props.settings,
      numberOfFramesCaptured: 0,
      isCreatingModel: false,
      capturing: false,
    };
    this.scanning = this.scanning.bind(this);
    this.capture = this.capture.bind(this);
    this.restartScan = this.restartScan.bind(this);
    this.createModel = this.createModel.bind(this);
    this.handleSpeechtoText = this.handleSpeechtoText.bind(this);
    this.completeScan = this.completeScan.bind(this);
  }

  componentDidMount() {
    if (this.state.currentlyScanning) {
      fetch("/open")
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error("Something went wrong");
          }
        })
        .then((data) =>
          this.setState({
            connectedToServer: true,
          })
        )
        .catch((error) => {
          console.error("Error:", error);
        });
    }

    if (!this.state.currentlyScanning && this.state.connectedToServer) {
      fetch("/close")
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error("Something went wrong");
          }
        })
        .then((data) =>
          this.setState({
            connectedToServer: false,
          })
        )
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  }

  scanning() {
    let temp = !this.state.currentlyScanning;
    this.setState(
      {
        currentlyScanning: temp,
        numberOfFramesCaptured: 0,
      },
      () => this.componentDidMount()
    );
  }

  capture() {
    this.setState({
      capturing: true,
    });
    fetch("/capture", {
      method: "GET",
    })
      .then((response) => {
        if (response.ok) {
          this.setState({
            capturing: false,
          });
          return response.json();
        } else {
          throw new Error("Something went wrong");
        }
      })
      .then((data) =>
        this.setState({
          numberOfFramesCaptured: this.state.numberOfFramesCaptured + 1,
        })
      )
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  restartScan() {
    fetch("/restart", {
      method: "GET",
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Something went wrong");
        }
      })
      .then((data) =>
        this.setState({
          numberOfFramesCaptured: 0,
        })
      )
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  createModel() {
    this.setState({
      isCreatingModel: true,
    });
    fetch("/models/create/" + this.modelName.value, {})
      .then((response) => {
        if (response.ok) {
          this.completeScan();
        } else {
          throw new Error("Something went wrong");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  completeScan() {
    fetch("/close")
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Something went wrong");
        }
      })
      .then((data) =>
        this.setState({
          currentlyScanning: false,
          connectedToServer: false,
          numberOfFramesCaptured: 0,
          isCreatingModel: false,
        })
      )
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  componentWillReceiveProps(settings) {
    if (settings.settings) {
      settings = settings.settings;
    }
    this.setState({ settings: settings });
  }

  handleSpeechtoText(transcript) {
    if (transcript.localeCompare("capture") === 0) {
      this.capture();
    }
  }
  render() {
    return (
      <div id="container" className="container-fluid p-3">
        <div className="row">
          <div className="col">
            <h1 className="text-left font-weight-light">Scan</h1>
          </div>
          {/* {this.state.settings ? 'gooddd' : 'nottttt'} */}
          <div className="float-right">
            {this.state.currentlyScanning ? (
              <>
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={this.restartScan}
                >
                  <img src={restartIcon} alt="Restart" />
                  &nbsp; Restart Scan
                </button>{" "}
                &nbsp;
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={this.scanning}
                >
                  <img src={cancelIcon} alt="Cancel" />
                  &nbsp; Cancel Scan
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-success"
                onClick={this.scanning}
              >
                <img src={addIcon} alt="Scan" />
                &nbsp; Scan a New Object
              </button>
            )}
          </div>
        </div>
        {/* <img id="frame" /> */}
        <div className="row">
          <div className="col pt-5">
            {this.state.currentlyScanning && this.state.connectedToServer ? (
              <>
                {console.log(this.state.settings)}
                {this.state.numberOfFramesCaptured >=
                this.state.settings.number_of_frames ? (
                  <div>
                    {this.state.isCreatingModel === false ? (
                      <div className="modal-dialog shadow" role="document">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title">
                              Enter a name for the model
                            </h5>
                          </div>
                          <div className="modal-body">
                            <input
                              className="form-control"
                              type="text"
                              placeholder="Name goes here"
                              ref={(c) => (this.modelName = c)}
                              name="modelName"
                            ></input>
                          </div>
                          <div className="modal-footer">
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={this.createModel}
                            >
                              Create 3D Model
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <img src={loadingGIF} alt="Loading" /> <br />{" "}
                        <h4 className="font-weight-light mt-3">
                          {" "}
                          Loading 3D Model
                        </h4>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="row">
                      <div className="col-3">
                        <button
                          type="button"
                          className="btn btn-primary btn-lg font-weight-light float-right"
                          onClick={this.capture}
                        >
                          Capture Frame
                        </button>
                        {this.state.capturing ? (
                          <img
                            src={loadingGIF}
                            className="ml-2"
                            width="25px"
                            height="25px"
                            alt="loading"
                          />
                        ) : (
                          "  "
                        )}
                      </div>
                      <div className="col-8">
                        <div className="container float-left d-flex my-auto">
                          <FramesPieChart
                            numberOfFrames={
                              this.state.settings.number_of_frames
                            }
                            numberOfFramesCaptured={
                              this.state.numberOfFramesCaptured
                            }
                          />
                          <div className="ml-3 text-left">
                            <h5 className="font-weight-normal justify-content-start">
                              {this.state.numberOfFramesCaptured}/
                              {this.state.settings.number_of_frames} frames were
                              captured
                              <h6 className="font-weight-light">
                                {" "}
                                Press "Capture Frame" and turn the object 90°
                                clockwise
                              </h6>
                              {this.state.settings.voice_control ? (
                                <>
                                  <img src={micIcon} alt="Mic Icon" />
                                  <span className="font-weight-light">
                                    Voice Control is on, you may say "capture"
                                  </span>
                                </>
                              ) : (
                                ""
                              )}
                            </h5>
                          </div>
                        </div>
                        {this.state.settings.voice_control ? (
                          <Dictaphone handleSpeech={this.handleSpeechtoText} />
                        ) : (
                          ""
                        )}
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-8 mx-auto">{<AlignedFrame />}</div>
                    </div>
                  </>
                )}
              </>
            ) : (
              ""
            )}
            {this.state.currentlyScanning && !this.state.connectedToServer ? (
              <div>
                <img src={loadingGIF} alt="Loading" /> <br />{" "}
                <h4 className="font-weight-light mt-3">
                  Waiting for Depth Camera
                </h4>
              </div>
            ) : (
              ""
            )}
            {!this.state.currentlyScanning ? (
              <div className="background-svg">
                <div className="alert alert-primary" role="alert">
                  <h3 className="font-weight-light">
                    Ready to 3D scan your object?
                  </h3>
                  <h4 className="font-weight-light">
                    Click "Scan a New Object"
                  </h4>
                  {/* <img src={scanScreenIcon} alt="Scan" /> */}
                </div>
                <div className="alert alert-warning" role="alert">
                  Before every scan make sure the settings fit your object!
                </div>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
    );
  }
}

function FramesPieChart({ numberOfFrames, numberOfFramesCaptured }) {
  const canvas = useRef(null);
  useEffect(() => {
    const cfg = {
      type: "pie",
      data: {
        labels: ["Captured", "Remained"],
        datasets: [
          {
            label: "Number of frames captured",
            data: [
              numberOfFramesCaptured,
              numberOfFrames - numberOfFramesCaptured,
            ],
            backgroundColor: ["rgb(2, 117, 216)", "rgb(247, 247, 247)"],
            hoverOffset: 4,
          },
        ],
      },
      options: {
        legend: {
          display: false,
        },
        responsive: false,
        tooltips: {
          enabled: false,
        },
      },
    };
    const chart = new Chart(canvas.current.getContext("2d"), cfg);
    return () => chart.destroy();
  });
  return (
    <div className="chartjs-wrapper">
      <canvas ref={canvas} className="chartjs" width="50" height="50"></canvas>
    </div>
  );
}

export const AlignedFrame = () => {
  const [frame, setFrame] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/feed/aligne")
        .then((response) => {
          if (response.ok) {
            return response.blob();
          } else {
            throw new Error("Something went wrong");
          }
        })
        .then((blob) => {
          var url = window.URL || window.webkitURL;
          var src = url.createObjectURL(blob);
          setFrame(src);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }, 500);

    return () => clearInterval(interval);
  }, [frame]);

  return (
    <>
      <img className="w-100 mt-4 rounded" src={frame} alt="camera feed" />
    </>
  );
};

export const Dictaphone = ({ handleSpeech }) => {
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
