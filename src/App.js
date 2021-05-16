import React, { useState, useEffect, useRef } from 'react';
// import logo from './logo.svg';
import './App.css';
import './bootstrap-4.3.1-dist/css/bootstrap.min.css';
import './stylesheet.css'
import scanScreenIcon from './images/camera_icon.svg';
import ModelsScreenIcon from './images/models_icon.svg';
import settingsScreenIcon from './images/settings_icon.svg';
import scanScreenIconWhite from './images/camera_icon_white.svg';
import ModelsScreenIconWhite from './images/models_icon_white.svg';
import settingsScreenIconWhite from './images/settings_icon_white.svg';
import addIcon from './images/add-white-24dp.svg';
import cancelIcon from './images/clear-white-24dp.svg';
import restartIcon from './images/restart_alt-white-24dp.svg'
import loadingGIF from './images/loading.gif';
import './fixed-left.css';
import Chart from '../node_modules/chart.js/dist/Chart.js';
import deleteIcon from './images/delete-white-24dp.svg'
import micIcon from './images/mic-black-24dp.svg'
// import view3D from './images/view_in_ar_black_48dp.svg'
import { OBJModel } from 'react-3d-viewer'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'




class Container extends React.Component {
  constructor(props) {
    super(props);
    this.handleMenuButtonClick = this.handleMenuButtonClick.bind(this);
    this.renderScreens = this.renderScreens.bind(this);
    this.updateSettings = this.updateSettings.bind(this);
    this.state = {
      current_screen: "scan",
      settings: null,
    };
  }

  componentDidMount() {
    if(this.state.settings !== null) {
      return;
    } 
    fetch('/settings').then(response => {
      if (response.ok) {
        return response.json()
      }
      else {
        throw new Error('Something went wrong');
      }
    }).then(data => {

      this.setState({
        settings: data,
      })
    }
    )
      .catch((error) => {
        console.error('Error:', error);
      })
  }


  handleMenuButtonClick(clickedButton) {
    fetch('/settings').then(response => {
      if (response.ok) {
        return response.json()
      }
      else {
        throw new Error('Something went wrong');
      }
    }).then(data => {
      if(this.state.settings != data) {
        this.setState({
          settings: data,
        })
      }
    }
    )
      .catch((error) => {
        console.error('Error:', error);
      })
    this.setState({
      current_screen: clickedButton,
    });
  }

  updateSettings(key, value) {
    let newSettings = this.state.settings;
    newSettings[key] = value;
    this.setState({
      settings: newSettings
    })
  }

  renderScreens() {
    if (this.state.current_screen === "scan") {
      return (
        <ScanScreen settings={this.state.settings} />
      );
    }
    if (this.state.current_screen === "my3DModels") {
      return (
        <My3DModelsScreen />
      );
    }
    if (this.state.current_screen === "settings") {
      return (
        <SettingsScreen onChildClick={this.updateSettings} settings={this.state.settings} />
      );
    }
  }

  render() {
    return (
      <div id="container" className="container-fluid">
        <div className="row ">
          <div className="container-fluid">
            <Menu onChildClick={this.handleMenuButtonClick} />
          </div>
          <div className="col-12 w-100">
            {this.renderScreens()}
          </div>
        </div>
      </div>
    );
  }
}

class Menu extends React.Component {
  constructor(props) {
    super(props);
    this.renderMenuButton = this.renderMenuButton.bind(this);
    this.buttonClick = this.buttonClick.bind(this);
    this.state = {
      pressed_button: "scan",
    };
  }

  buttonClick(event) {
    const id = event.target.id;
    this.props.onChildClick(id);
    this.setState({
      pressed_button: id,
    });
  }

  renderMenuButton(name, icon, iconWhite, id) {
    return (
      <>
        {this.state.pressed_button === id ?
          <button id={id} type="button" className="btn btn-primary btn-lg w-100 shadow-sm mb-3 rounded font-weight-light nav-item menu-button"
            onClick={this.buttonClick}>
            <img id={id} src={iconWhite} alt={id} />
            <br />
            {name}
          </button>
          :
          <button id={id} type="button" className="btn btn-light btn-lg w-100 shadow-sm mb-3 bg-white rounded font-weight-light nav-item menu-button"
            onClick={this.buttonClick}>
            <img id={id} src={icon} alt={id} />
            <br />
            {name}
          </button>}
      </>
    );
  }

  render() {
    return (
      <nav className="navbar navbar-expand-md navbar-dark col card shadow pt-3 fixed-left menu-bg-color">
        <div className="collapse navbar-collapse" id="navbarsExampleDefault">
          <h1 className="font-weight-light blue">3D One</h1>
          <ul className="navbar-nav">
            {this.renderMenuButton("Scan", scanScreenIcon, scanScreenIconWhite, "scan")}
            {this.renderMenuButton("My 3D Models", ModelsScreenIcon, ModelsScreenIconWhite, "my3DModels")}
            <div className="">
              {this.renderMenuButton("Settings", settingsScreenIcon, settingsScreenIconWhite, "settings")}
            </div>
          </ul>
        </div>
      </nav>);
  }
}

class ScanScreen extends React.Component {
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

  async componentDidMount() {
    if (this.state.currentlyScanning && !this.state.connectedToServer) {
      await fetch('/open').then(response => {
        if (response.ok) {
          return response.json()
        }
        else {
          throw new Error('Something went wrong');
        }
      }).then(data =>
        this.setState({
          connectedToServer: true,
        })
      )
        .catch((error) => {
          console.error('Error:', error);
        })
    }

    if (!this.state.currentlyScanning && this.state.connectedToServer) {
      fetch('/close').then(response => {
        if (response.ok) {
          return response.json()
        }
        else {
          throw new Error('Something went wrong');
        }
      }).then(data =>
        this.setState({
          connectedToServer: false,
        })
      )
        .catch((error) => {
          console.error('Error:', error);
        })
    }
  }

  scanning() {
    let temp = !this.state.currentlyScanning;
    this.setState({
      currentlyScanning: temp,
      numberOfFramesCaptured: 0,
    }, () => this.componentDidMount());


  }

  capture() {
    let newSettings = this.state.settings
    newSettings['last_object'] = ''
    this.setState({
      capturing: true,
      settings: newSettings,
    })
    fetch('/capture', {
      method: 'GET'
    }).then(response => {
      if (response.ok) {
        this.setState({
          capturing: false,
        })
        return response.json()
      }
      else {
        throw new Error('Something went wrong');
      }
    }).then(data =>
      this.setState({
        numberOfFramesCaptured: this.state.numberOfFramesCaptured + 1,
      })
    )
      .catch((error) => {
        console.error('Error:', error);
      })
  }

  restartScan() {
    fetch('/restart', {
      method: 'GET'
    }).then(response => {
      if (response.ok) {
        return response.json()
      }
      else {
        throw new Error('Something went wrong');
      }
    }).then(data =>
      this.setState({
        numberOfFramesCaptured: 0,
      })
    )
      .catch((error) => {
        console.error('Error:', error);
      })
  }


  createModel() {
    let newSettings = this.state.settings
    newSettings['last_object'] = this.modelName.value;
    this.setState({
      isCreatingModel: true,
      settings: newSettings,
    })
    fetch('/models/create/' + this.modelName.value, {
    }).then(response => {
      if (response.ok) {
        this.completeScan();
      }
      else {
        throw new Error('Something went wrong');
      }
    })
      .catch((error) => {
        console.error('Error:', error);
      })
  }

  completeScan() {
    fetch('/close').then(response => {
      if (response.ok) {
        return response.json()
      }
      else {
        throw new Error('Something went wrong');
      }
    }).then(data =>
      this.setState({
        currentlyScanning: false,
        connectedToServer: false,
        numberOfFramesCaptured: 0,
        isCreatingModel: false,
      })
    )
      .catch((error) => {
        console.error('Error:', error);
      })
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
            {this.state.currentlyScanning ?
              <>
                <button type="button" className="btn btn-dark" onClick={this.restartScan}>
                  <img src={restartIcon} alt="Restart" />&nbsp;
            Restart Scan
            </button> &nbsp;
            <button type="button" className="btn btn-danger" onClick={this.scanning}>
                  <img src={cancelIcon} alt="Cancel" />&nbsp;
            Cancel Scan
            </button>
              </>
              :
              <button type="button" className="btn btn-success" onClick={this.scanning}>
                <img src={addIcon} alt="Scan" />&nbsp;
              Scan a New Object
              </button>
            }
          </div>
        </div>
        {/* <img id="frame" /> */}
        <div className="row">
          <div className="col pt-5">
            {this.state.currentlyScanning && this.state.connectedToServer ?
              <>
                {this.state.numberOfFramesCaptured >= this.state.settings.number_of_frames ?
                  <div>
                    {this.state.isCreatingModel === false ? <div className="modal-dialog shadow" role="document">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title">Enter a name for the model</h5>
                        </div>
                        <div className="modal-body">
                          <input className="form-control" type="text" placeholder="Name goes here" ref={(c) => this.modelName = c} name="modelName" ></input>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn btn-primary" onClick={this.createModel}>Create 3D Model</button>
                        </div>
                      </div>
                    </div> :
                      <div><img src={loadingGIF} alt="Loading" /> <br /> <h4 className="font-weight-light mt-3"> Loading 3D Model</h4></div>
                    }
                  </div>
                  :
                  <>
                    <div className="row">
                      <div className="col-3">
                      <button type="button" className="btn btn-primary btn-lg font-weight-light float-right" onClick={this.capture}>Capture Frame</button>
                      {this.state.capturing? <img src={loadingGIF} className="ml-2" width="25px" height="25px" alt="loading"/> : '  '}


                      </div>
                      <div className="col-8">
                    <div className="container float-left d-flex my-auto">
                      <FramesPieChart numberOfFrames={this.state.settings.number_of_frames} numberOfFramesCaptured={this.state.numberOfFramesCaptured} />
                      <div className="ml-3 text-left">
                        <h5 className="font-weight-normal justify-content-start">{this.state.numberOfFramesCaptured}/{this.state.settings.number_of_frames} frames were captured
                <h6 className="font-weight-light"> Press "Capture Frame" and turn the object 90° clockwise</h6>
                          {this.state.settings.voice_control ? <><img src={micIcon} alt="Mic Icon" /><span className="font-weight-light">Voice Control is on,  you may say "capture"</span></> : ''}
                        </h5>
                      </div>
                    </div>
                    {this.state.settings.voice_control ? <Dictaphone handleSpeech={this.handleSpeechtoText} /> : ''}
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-8 mx-auto">
                      {<AlignedFrame />}
                      </div>
                    </div>
                  </>
                }
              </> : ''}
            {this.state.currentlyScanning && !this.state.connectedToServer ?
              <div><img src={loadingGIF} alt="Loading" /> <br /> <h4 className="font-weight-light mt-3">Waiting for Depth Camera</h4></div>
              : ''}
            {!this.state.currentlyScanning ?
              <div className="background-svg">
                <div className="alert alert-primary" role="alert">
                <h3 className="font-weight-light">Ready to 3D scan your object?</h3>
                <h4 className="font-weight-light">Click "Scan a New Object"</h4>
                {/* <img src={scanScreenIcon} alt="Scan" /> */}
                </div>
                <div className="alert alert-warning" role="alert">
                  Before every scan make sure the settings fit your object!
                </div>
              </div>
              : ''}
          </div>
        </div>
      </div>
    );
  }
}

export const Dictaphone = ({ handleSpeech }) => {
  const commands = [
    {
      command: 'capture',
      callback: () => {resetTranscript(); handleSpeech('capture');},
      matchInterim: true
    },
    {
      command: 'doctor',
      callback: () => {resetTranscript(); handleSpeech('capture');},
      matchInterim: true
    },
  ]
  const { transcript, resetTranscript } = useSpeechRecognition({commands})

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return null
  }

  SpeechRecognition.startListening({
    continuous: true,
    language: 'en-US, he'
  })
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
  )
}

export const AlignedFrame = () => {
  const [frame, setFrame] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/feed/aligne').then(response => {
        if (response.ok) {
          return response.blob()
        }
        else {
          throw new Error('Something went wrong');
        }
      }).then(blob => {
        var url = window.URL || window.webkitURL;
        var src = url.createObjectURL(blob);
        setFrame(src)
      })
        .catch((error) => {
          console.error('Error:', error);
        })
    }, 500);


    return () => clearInterval(interval);
  }, [frame])

  return (
    <>
      <img className="w-100 mt-4 rounded" src={frame} alt="camera feed" />
    </>
  )
}

function FramesPieChart({ numberOfFrames, numberOfFramesCaptured }) {
  const canvas = useRef(null);
  useEffect(() => {
    const cfg = {
      type: 'pie',
      data: {
        labels: [
          'Captured',
          'Remained',
        ],
        datasets: [{
          label: 'Number of frames captured',
          data: [numberOfFramesCaptured, (numberOfFrames - numberOfFramesCaptured)],
          backgroundColor: [
            'rgb(2, 117, 216)',
            'rgb(247, 247, 247)'
          ],
          hoverOffset: 4
        }]
      },
      options: {
        legend: {
          display: false
        },
        responsive: false,
        tooltips: {
          enabled: false
        }
      }
    };
    const chart = new Chart(canvas.current.getContext('2d'), cfg);
    return () => chart.destroy();
  });
  return <div className="chartjs-wrapper">

    <canvas ref={canvas} className="chartjs" width="50" height="50"></canvas>
  </div>;
}

class My3DModelsScreen extends React.Component {
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
    fetch('/models').then(response => {
      if (response.ok) {
        return response.json()
      } else {
        throw new Error('Something went wrong');
      }
    }).then(data =>
      this.setState({
        models: data,
      })
    )
      .catch((error) => {
        console.error('Error:', error);
      })
  }



  viewModel(name) {
    fetch('/models/view/' + name).then(response => {
      if (response.ok) {
        this.setState({
          isLoading3DModel: false,
        })
      } else {
        throw new Error('Something went wrong');
      }
    })
      .catch((error) => {
        console.error('Error:', error);
        this.setState({
          isLoading3DModel: false,
        })
      })
  }

  deleteModel(modelName) {
    let name = encodeURIComponent(modelName.trim())
    let newModels;
    fetch('/models/delete/' + name).then(response => {
      if (response.ok) {
        return response.json()
      }
      else {
        throw new Error('Something went wrong');
      }
    }).then(data => {
      newModels = this.state.models.filter(
        function (model) { return model.name !== modelName });
      this.setState({
        models: newModels,
      })
    })
      .catch((error) => {
        console.error('Error:', error);
      })
  }

  
  render() {
    return (
      <div id="container" className="container-fluid p-3">
        <div className="row">
          <div className="col">
            <h1 className="text-left font-weight-light">My 3D Models</h1>
            {this.state.spesificModel === null ? this.state.models.reverse().map((model, index, array) => {
              return (
                <div key={index} className="m-4 p-4 border-bottom text-left">
                  <div className="row">
                    <div className="col">
                      <img src={model.img_url} className="rounded float-left" width="300px" height="168px" alt={model.name} />

                      <div className="pl-3 float-left">
                        <h3 className="font-weight-light">{model.name}</h3>
                        <ul className="list-group list-group-flush">
                          <li className="list-group-item"><button className="btn btn-primary" onClick={() => {this.viewModel(model.name); this.setState({isLoading3DModel: true, spesificModelColored: this.state.models[array.length - 1 - index] })}}>View 3D Model</button>
                          {this.state.isLoading3DModel && this.state.spesificModelColored === model ? <img src={loadingGIF} className="ml-2" width="25px" height="25px" alt="loading"/> : '  '}</li>
                          <li className="list-group-item"><button className="btn btn-secondary" onClick={() => { this.setState({ spesificModel: this.state.models[array.length - 1 - index] }) }}>View 3D Model Grayscale Preview</button></li>
                          <li className="list-group-item">Scanned at {model.creation_date}</li>
                          <li className="list-group-item">Size: {model.size}</li>
                          <li className="list-group-item">Captured using {model.number_of_frames} frames</li>
                        </ul>
                      </div>
                    </div>
                    <div className="col">
                      <button type="button" className="btn bg-danger p-1 rounded float-right" onClick={(event) => this.deleteModel(model.name)}>
                        <img src={deleteIcon} alt="Delete" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
            ) : <div>
              {this.state.isLoading ? <div><img src={loadingGIF} alt="Loading" /> <br /> <h4 className="font-weight-light mt-3"> Loading 3D Model</h4></div> :
                <div className="row">
                  <div className="col">
                    <h3 className="font-weight-light float-left">{this.state.spesificModel.name}</h3>
                  </div>
                  <div className="col">
                    <div className="float-right">
                      <button type="button" className="btn btn-dark mb-2" onClick={() => this.setState({ spesificModel: null })}>
                        <img src={cancelIcon} alt="Exit" />&nbsp;
                        Exit 3D Model View
                      </button>
                    </div>
                  </div>
                </div>}
              <div>
                <OBJModel src={this.state.spesificModel.model_url} alt='3D Model' width="1000" height="400"
                  onProgress={() => { this.setState({ isLoading: true });}} onLoad={() => { this.setState({ isLoading: false });}} />
              </div></div>}
          </div>
        </div>
      </div>
    );
  }
}

class SettingsScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: props.settings,
      obj_radius: props.settings['obj_radius'],
      number_of_frames: props.settings['number_of_frames'],
      recreating: false,
    };
    this.handleVoiceControlChange = this.handleVoiceControlChange.bind(this);
    this.handleObjParamsChange = this.handleObjParamsChange.bind(this);
  }

  // componentWillReceiveProps(settings) {
  //   this.setState({ settings: settings });
  // }

  updateSettings(key, value) {
    this.props.onChildClick(key, value)
  }

  handleObjParamsChange(event) {
    let key = event.target.id;
    let value = event.target.value;
    if( key === "obj_distance") {
      value = Number.parseFloat(value).toFixed(3)
    }
    if(key != "number_of_frames") {
      value = Number.parseFloat(value).toFixed(2)
    }
    if (key === "obj_radius") {
      this.setState({
        obj_radius: value,
      })
    }
    if (key === "number_of_frames") {
      this.setState({
        number_of_frames: event.target.value,
      })
    }
    fetch('/settings/' + key + '/' + value).then(response => {

      if (response.ok) {
        return response
      }
      else {
        throw new Error('Something went wrong');
      }
    }).then(data => {
      this.updateSettings(key, value);
    })
      .catch((error) => {
        console.error('Error:', error);
      })
  }

  handleVoiceControlChange(event) {
    let value = event.target.checked;
    let new_val;
    if (value) {
      new_val = 1;
    }
    else {
      new_val = 0;
    }

    fetch('/settings/voice_control/' + new_val).then(response => {
      if (response.ok) {
        return response
      }
      else {
        throw new Error('Something went wrong');
      }
    }).then(data => {
      this.updateSettings("voice_control", value);
    })
      .catch((error) => {
        console.error('Error:', error);
      })
  }

  recreateModel() {
    this.setState({
      recreating: true
    });
    fetch('/recreate', {
    }).then(response => {
      if (response.ok) {
        this.setState({
          recreating: false,
        });
      }
      else {
        throw new Error('Something went wrong');
      }
    })
      .catch((error) => {
        console.error('Error:', error);
      })
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
                <input className="form-check-input" type="checkbox" id="voice_control" onClick={this.handleVoiceControlChange} defaultChecked={this.state.settings.voice_control} />
                <small>Use Voice Control to capture frames using your voice. Whenever scanning you may say "capture" instead of pressing "capture" button.</small>
              </div>
            </div>
            <div className="row m-4 p-4 border-bottom">
              <div className="col-3 text-right">
                <label htmlFor="points">Object's Center Distance From Camera in Meters:</label>
              </div>
              <div className="col-5 float-left text-left">
                <input name="radius" type="number" id="obj_distance" step="0.001" className="form-control"
                  placeholder={this.state.settings.obj_distance} defaultValue={this.state.settings.obj_distance} onChange={this.handleObjParamsChange} ref={el => this.radius = el} required />
                <small>Accurate input will result a finer merge of all frames.</small>
              </div>
            </div>
            <div className="row m-4 p-4 border-bottom">
              <div className="col-3 text-right">
                <label htmlFor="points">Object Radius:</label>
              </div>
              <div className="col-5 float-left text-left">
                <input className="w-75 mr-2" type="range" id="obj_radius" name="points" step="0.05"
                  defaultValue={this.state.obj_radius} min="0.1" max="3" onChange={this.handleObjParamsChange} /> {this.state.obj_radius}
                <br />
                <small>Accurate input will result a finer cropping of the object from it's environment.</small>
              </div>
            </div>
            <div className="row m-4 p-4 border-bottom">
              <div className="col-3 text-right">
                <label htmlFor="points">Number of Frames:</label>
              </div>
              <div className="col-5 float-left text-left">
                <input className="w-75 mr-2" type="range" id="number_of_frames" name="points" step="2"
                  defaultValue={this.state.settings.number_of_frames} min="2" max="8" onChange={this.handleObjParamsChange} /> {this.state.number_of_frames}
                <br />
                <small>4 is the recommended number of frames.</small>
              </div>
            </div>
            <div className="row m-4 p-4 border-bottom">
              <div className="col-3 text-right">
                <label htmlFor="points">Recreate Last 3D Model:</label>
              </div>
              <div className="col-5 float-left text-left">
              {this.state.settings.last_object != '' && this.state.settings.last_object != undefined ?  [
                this.state.recreating === false ?
                  <button className="btn btn-secondary" onClick={() => {this.recreateModel()}}>Recreate "{this.state.settings.last_object}" 3D Model Using {this.state.settings.last_NOF} frames</button>
                  :
                  <>Recreating "{this.state.settings.last_object}" 3D Model using {this.state.settings.last_NOF} frames <img src={loadingGIF} className="ml-2" width="25px" height="25px" alt="loading"/></>
                ]: 
               "No frames in cache"} 
                <br />
                <small>Use last object's frames to reacreate a 3D Model with new settings. <br/>The number of frames setting will not affect recreation.</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  componentWillReceiveProps(settings) {
    this.setState({ settings: settings });
  }
}
function App() {
  return (
    <div className="App">
      <Container />
    </div>
  );
}

export default App;