import React, { useState, useEffect, useRef } from "react";
import loadingGIF from "./images/loading.gif";

export default class SettingsScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: props.settings,
      obj_radius: props.settings["obj_radius"],
      number_of_frames: props.settings["number_of_frames"],
      obj_deviation: props.settings["obj_deviation"],
      recreating: false,
    };
    this.handleVoiceControlChange = this.handleVoiceControlChange.bind(this);
    this.handleObjParamsChange = this.handleObjParamsChange.bind(this);
  }

  // componentWillReceiveProps(settings) {
  //   this.setState({ settings: settings });
  // }

  updateSettings(key, value) {
    this.props.onChildClick(key, value);
  }

  handleObjParamsChange(event) {
    let key = event.target.id;
    let value = event.target.value;
    if (key === "obj_distance") {
      value = Number.parseFloat(value).toFixed(3);
    }
    if (key != "number_of_frames") {
      value = Number.parseFloat(value).toFixed(3);
    }
    if (key === "obj_radius") {
      this.setState({
        obj_radius: value,
      });
    }
    if (key === "number_of_frames") {
      this.setState({
        number_of_frames: event.target.value,
      });
    }
    if (key === "obj_deviation") {
      this.setState({
        obj_deviation: value,
      });
    }
    fetch("/settings/" + key + "/" + value)
      .then((response) => {
        if (response.ok) {
          return response;
        } else {
          throw new Error("Something went wrong");
        }
      })
      .then((data) => {
        this.updateSettings(key, value);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  handleVoiceControlChange(event) {
    let value = event.target.checked;
    let new_val;
    if (value) {
      new_val = 1;
    } else {
      new_val = 0;
    }

    fetch("/settings/voice_control/" + new_val)
      .then((response) => {
        if (response.ok) {
          return response;
        } else {
          throw new Error("Something went wrong");
        }
      })
      .then((data) => {
        this.updateSettings("voice_control", value);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  recreateModel() {
    this.setState({
      recreating: true,
    });
    fetch("/recreate", {})
      .then((response) => {
        if (response.ok) {
          this.setState({
            recreating: false,
          });
        } else {
          throw new Error("Something went wrong");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // componentWillReceiveProps(settings) {
  //   if (settings.settings) {
  //     settings = settings.settings;
  //   }
  //   this.setState({ settings: settings });
  // }

  render() {
    return (
      <div id="container" className="container-fluid p-3">
        <div className="row">
          <div className="col">
            <h1 className="text-left font-weight-light">Settings</h1>
            <div className="row m-4 p-4 border-bottom">
              <div className="col-3 text-right">
                <label className="form-check-label" htmlFor="voiceCapture">
                  Enable Voice Control:
                </label>
              </div>
              <div className="col-5 float-left text-left">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="voice_control"
                  onClick={this.handleVoiceControlChange}
                  defaultChecked={this.state.settings.voice_control}
                />
                <small>
                  Use Voice Control to capture frames using your voice. Whenever
                  scanning you may say "capture" instead of pressing "capture"
                  button.
                </small>
              </div>
            </div>
            <div className="row m-4 p-4 border-bottom">
              <div className="col-3 text-right">
                <label htmlFor="points">
                  Object's Center Distance From Camera in Meters:
                </label>
              </div>
              <div className="col-5 float-left text-left">
                <input
                  name="radius"
                  type="number"
                  id="obj_distance"
                  step="0.001"
                  className="form-control"
                  placeholder={this.state.settings.obj_distance}
                  defaultValue={this.state.settings.obj_distance}
                  onChange={this.handleObjParamsChange}
                  ref={(el) => (this.radius = el)}
                  required
                />
                <small>
                  Accurate input will result a finer merge of all frames.
                </small>
              </div>
            </div>
            <div className="row m-4 p-4 border-bottom">
              <div className="col-3 text-right">
                <label htmlFor="points">Object Radius:</label>
              </div>
              <div className="col-5 float-left text-left">
                <input
                  className="w-75 mr-2"
                  type="range"
                  id="obj_radius"
                  name="points"
                  step="0.05"
                  defaultValue={this.state.obj_radius}
                  min="0.1"
                  max="3"
                  onChange={this.handleObjParamsChange}
                />{" "}
                {this.state.obj_radius}
                <br />
                <small>
                  Accurate input will result a finer cropping of the object from
                  it's environment.
                </small>
              </div>
            </div>
            <div className="row m-4 p-4 border-bottom">
              <div className="col-3 text-right">
                <label htmlFor="points">Number of Frames:</label>
              </div>
              <div className="col-5 float-left text-left">
                <input
                  className="w-75 mr-2"
                  type="range"
                  id="number_of_frames"
                  name="points"
                  step="2"
                  defaultValue={this.state.settings.number_of_frames}
                  min="2"
                  max="8"
                  onChange={this.handleObjParamsChange}
                />{" "}
                {this.state.number_of_frames}
                <br />
                <small>4 is the recommended number of frames.</small>
              </div>
            </div>
            <div className="row m-4 p-4 border-bottom">
              <div className="col-3 text-right">
                <label htmlFor="points">Object Deviation Correction:</label>
              </div>
              <div className="col-5 float-left text-left">
                <input
                  className="w-75 mr-2"
                  type="range"
                  id="obj_deviation"
                  name="points"
                  step="0.001"
                  defaultValue={this.state.obj_deviation}
                  min="0"
                  max="0.03"
                  onChange={this.handleObjParamsChange}
                />{" "}
                {this.state.obj_deviation}
                <br />
                <small>
                  This field will help fix object's misalignment issues.
                  It is recommended to use this field only for recreating a model.
                </small>
              </div>
            </div>
            <div className="row m-4 p-4 border-bottom">
              <div className="col-3 text-right">
                <label htmlFor="points">Recreate Last 3D Model:</label>
              </div>
              <div className="col-5 float-left text-left">
                {this.state.settings.last_object != "" &&
                this.state.settings.last_object != undefined
                  ? [
                      this.state.recreating === false ? (
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            this.recreateModel();
                          }}
                        >
                          Recreate "{this.state.settings.last_object}" 3D Model
                          Using {this.state.settings.last_NOF} frames
                        </button>
                      ) : (
                        <>
                          Recreating "{this.state.settings.last_object}" 3D
                          Model using {this.state.settings.last_NOF} frames{" "}
                          <img
                            src={loadingGIF}
                            className="ml-2"
                            width="25px"
                            height="25px"
                            alt="loading"
                          />
                        </>
                      ),
                    ]
                  : "No frames in cache"}
                <br />
                <small>
                  Use last object's frames to reacreate a 3D Model with new
                  settings. <br />
                  The number of frames setting will not affect recreation.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  componentWillReceiveProps(settings) {
    if (settings.settings) {
      settings = settings.settings;
    }
    this.setState({ settings: settings });
  }
}
