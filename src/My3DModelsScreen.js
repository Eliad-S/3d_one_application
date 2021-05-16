import React, { useState, useEffect, useRef } from "react";
import loadingGIF from "./images/loading.gif";
import deleteIcon from "./images/delete-white-24dp.svg";
import cancelIcon from "./images/clear-white-24dp.svg";
import { OBJModel } from "react-3d-viewer";

export default class My3DModelsScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      models: [],
      spesificModel: null,
      spesificModelColored: null,
      isLoading: true,
      isLoading3DModel: false,
    };
  }

  componentDidMount() {
    fetch("/models")
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Something went wrong");
        }
      })
      .then((data) =>
        this.setState({
          models: data,
        })
      )
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  viewModel(name) {
    fetch("/models/view/" + name)
      .then((response) => {
        if (response.ok) {
          this.setState({
            isLoading3DModel: false,
          });
        } else {
          throw new Error("Something went wrong");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        this.setState({
          isLoading3DModel: false,
        });
      });
  }

  deleteModel(modelName) {
    let name = encodeURIComponent(modelName.trim());
    let newModels;
    fetch("/models/delete/" + name)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Something went wrong");
        }
      })
      .then((data) => {
        newModels = this.state.models.filter(function (model) {
          return model.name !== modelName;
        });
        this.setState({
          models: newModels,
        });
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  render() {
    return (
      <div id="container" className="container-fluid p-3">
        <div className="row">
          <div className="col">
            <h1 className="text-left font-weight-light">My 3D Models</h1>
            {this.state.spesificModel === null ? (
              this.state.models.reverse().map((model, index, array) => {
                return (
                  <div key={index} className="m-4 p-4 border-bottom text-left">
                    <div className="row">
                      <div className="col">
                        <img
                          src={model.img_url}
                          className="rounded float-left"
                          width="300px"
                          height="168px"
                          alt={model.name}
                        />

                        <div className="pl-3 float-left">
                          <h3 className="font-weight-light">{model.name}</h3>
                          <ul className="list-group list-group-flush">
                            <li className="list-group-item">
                              <button
                                className="btn btn-primary"
                                onClick={() => {
                                  this.viewModel(model.name);
                                  this.setState({
                                    isLoading3DModel: true,
                                    spesificModelColored:
                                      this.state.models[
                                        array.length - 1 - index
                                      ],
                                  });
                                }}
                              >
                                View 3D Model
                              </button>
                              {this.state.isLoading3DModel &&
                              this.state.spesificModelColored === model ? (
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
                            </li>
                            <li className="list-group-item">
                              <button
                                className="btn btn-secondary"
                                onClick={() => {
                                  this.setState({
                                    spesificModel:
                                      this.state.models[
                                        array.length - 1 - index
                                      ],
                                  });
                                }}
                              >
                                View 3D Model Grayscale Preview
                              </button>
                            </li>
                            <li className="list-group-item">
                              Scanned at {model.creation_date}
                            </li>
                            <li className="list-group-item">
                              Size: {model.size}
                            </li>
                            <li className="list-group-item">
                              Captured using {model.number_of_frames} frames
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="col">
                        <button
                          type="button"
                          className="btn bg-danger p-1 rounded float-right"
                          onClick={(event) => this.deleteModel(model.name)}
                        >
                          <img src={deleteIcon} alt="Delete" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div>
                {this.state.isLoading ? (
                  <div>
                    <img src={loadingGIF} alt="Loading" /> <br />{" "}
                    <h4 className="font-weight-light mt-3">
                      {" "}
                      Loading 3D Model
                    </h4>
                  </div>
                ) : (
                  <div className="row">
                    <div className="col">
                      <h3 className="font-weight-light float-left">
                        {this.state.spesificModel.name}
                      </h3>
                    </div>
                    <div className="col">
                      <div className="float-right">
                        <button
                          type="button"
                          className="btn btn-dark mb-2"
                          onClick={() => this.setState({ spesificModel: null })}
                        >
                          <img src={cancelIcon} alt="Exit" />
                          &nbsp; Exit 3D Model View
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <OBJModel
                    src={this.state.spesificModel.model_url}
                    alt="3D Model"
                    width="1000"
                    height="400"
                    onProgress={() => {
                      this.setState({ isLoading: true });
                    }}
                    onLoad={() => {
                      this.setState({ isLoading: false });
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
