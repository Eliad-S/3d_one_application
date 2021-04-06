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
import { OBJModel, JSONModel, Tick, MTLModel, DAEModel } from 'react-3d-viewer'
// import eliad from '../public/e.obj'
// import eliad from '../api/eliad sellem(1).jpg'

import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { nodeName } from 'jquery';




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
    console.log("settingsss")
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
      }, () => console.log('current: ' + this.state.settings.number_of_frames))
    }
    )
      .catch((error) => {
        console.error('Error:', error);
      })
  }


  handleMenuButtonClick(clickedButton) {
    this.setState({
      current_screen: clickedButton,
    });
  }

  updateSettings(key, value) {
    console.log(key + ": " + value)
    console.log(this.state.settings)
    let newSettings = this.state.settings;
    newSettings[key] = value;
    console.log(newSettings)
    this.setState({
      settings: newSettings
    }, console.log(this.state.settings))
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
          <button id={id} type="button" className="btn btn-primary btn-lg w-100 shadow-sm mb-3 rounded font-weight-light nav-item "
            onClick={this.buttonClick}>
            {name}
            <br />
            <img id={id} src={iconWhite} alt={id} />
          </button>
          :
          <button id={id} type="button" className="btn btn-light btn-lg w-100 shadow-sm mb-3 bg-white rounded font-weight-light nav-item "
            onClick={this.buttonClick}>
            {name}
            <br />
            <img id={id} src={icon} alt={id} />
          </button>}
      </>
    );
  }

  render() {
    return (
      <nav className="navbar navbar-expand-md navbar-dark col card shadow pt-3 fixed-left menu-bg-color">
        <div class="collapse navbar-collapse" id="navbarsExampleDefault">
          <h1 className="font-weight-light">3D One</h1>
          <ul class="navbar-nav">
            {this.renderMenuButton("Scan", scanScreenIcon, scanScreenIconWhite, "scan")}
            {this.renderMenuButton("My 3D Models", ModelsScreenIcon, ModelsScreenIconWhite, "my3DModels")}
            <div className="">
              {this.renderMenuButton("Settings", settingsScreenIcon, settingsScreenIconWhite, "settings")}
            </div>
            {/*        <li class="nav-item">
                <a class="nav-link" data-class="fixed-left">
                    <i class="fa fa-arrow-left"></i>
                    Fixed Left
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-class="fixed-top">
                    <i class="fa fa-arrow-up"></i>
                    Fixed Top
                    <small>(original)</small>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" data-class="fixed-right">
                    <i class="fa fa-arrow-right"></i>
                    Fixed Right
                </a>
            </li> */}
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
    };
    this.scanning = this.scanning.bind(this);
    this.capture = this.capture.bind(this);
    this.restartScan = this.restartScan.bind(this);
    this.createModel = this.createModel.bind(this);
    this.handleSpeechtoText = this.handleSpeechtoText.bind(this);
    this.completeScan = this.completeScan.bind(this);
  }

  async componentDidMount() {
    console.log("connected: " + this.state.connectedToServer);
    console.log('scanning: ' + this.state.currentlyScanning);
    if (this.state.currentlyScanning && !this.state.connectedToServer) {
      console.log("Connecting to Server");
      await fetch('/open').then(response => {
        if (response.ok) {
          console.log("open");
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
          console.log("close");
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
    fetch('/capture', {
      method: 'GET'
    }).then(response => {
      if (response.ok) {
        console.log("capture");
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
        console.log("restart");
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
    console.log(this.modelName.value)
    this.setState({
      isCreatingModel: true
    })
    fetch('/models/create/' + this.modelName.value, {
    }).then(response => {
      if (response.ok) {
        console.log("model created");
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
        console.log("close");
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
    console.log(transcript + "!!!!")
    console.log(transcript.localeCompare("capture") === 0)
    if (transcript.localeCompare("capture") === 0) {
      this.capture();
    }
  }
  render() {
    return (
      <div id="container" className="container-fluid p-3">
        <div class="row">
          <div class="col">
            <h1 className="text-left font-weight-light">Scan</h1>
          </div>
          {this.state.settings ? 'gooddd' : 'nottttt'}
          <div className="float-right">
            {this.state.currentlyScanning ?
              <>
                <button type="button" class="btn btn-dark" onClick={this.restartScan}>
                  <img src={restartIcon} alt="Restart" />&nbsp;
            Restart Scan
            </button> &nbsp;
            <button type="button" class="btn btn-danger" onClick={this.scanning}>
                  <img src={cancelIcon} alt="Cancel" />&nbsp;
            Cancel Scan
            </button>
              </>
              :
              <button type="button" class="btn btn-success" onClick={this.scanning}>
                <img src={addIcon} alt="Scan" />&nbsp;
              Scan a New Object
              </button>
            }
          </div>
        </div>
        {/* <img id="frame" /> */}
        <div className="row">
          {console.log(this.state.settings)}
          <div className="col pt-5">
            {this.state.currentlyScanning && this.state.connectedToServer ?
              // fetch('/feed/aligned')
              // .then(res=>{return res.blob()})
              // .then(blob=>{
              //   var img = URL.createObjectURL(blob);
              //   // Do whatever with the img
              //   document.getElementById('frame').setAttribute('src', img);
              // })
              <>
                {this.state.numberOfFramesCaptured === this.state.settings.number_of_frames ?
                  <div>
                    {this.state.isCreatingModel === false ? <div class="modal-dialog shadow" role="document">
                      <div class="modal-content">
                        <div class="modal-header">
                          <h5 class="modal-title">Enter a name for the model</h5>
                        </div>
                        <div class="modal-body">
                          <input class="form-control" type="text" placeholder="Name goes here" ref={(c) => this.modelName = c} name="modelName" ></input>
                        </div>
                        <div class="modal-footer">
                          <button type="button" class="btn btn-primary" onClick={this.createModel}>Create 3D Model</button>
                        </div>
                      </div>
                    </div> :
                      <div><img src={loadingGIF} alt="Loading" /> <br /> <h4 className="font-weight-light mt-3"> Loading 3D Model</h4></div>
                    }
                  </div>
                  :
                  <>
                    <button type="button" className="btn btn-primary btn-lg font-weight-light float-left" onClick={this.capture}>Capture Frame</button>
                    <div className="container float-left d-flex my-auto">
                      <FramesPieChart numberOfFrames={this.state.settings.number_of_frames} numberOfFramesCaptured={this.state.numberOfFramesCaptured} />
                      <div className="ml-3 text-left">
                        <h5 className="font-weight-normal justify-content-start">{this.state.numberOfFramesCaptured}/{this.state.settings.number_of_frames} frames were captured
                <h6 className="font-weight-light"> Press "Capture Frame" and turn the object 90° clockwise</h6>
                          {this.state.settings.voice_control ? <><img src={micIcon} alt="Mic Icon" /><h6 className="font-weight-light">Voice Control is on,  you may say "capture"</h6></> : ''}
                        </h5>
                      </div>
                      {console.log(this.state.settings.number_of_frames)}
                    </div>
                    <Dictaphone handleSpeech={this.handleSpeechtoText} />
                    {<TodoPage />}
                  </>
                }
              </> : ''}
            {this.state.currentlyScanning && !this.state.connectedToServer ?
              <div><img src={loadingGIF} alt="Loading" /> <br /> <h4 className="font-weight-light mt-3">Waiting for Server</h4></div>
              : ''}
            {!this.state.currentlyScanning ?
              <div>
                <h3 className="text-secondary font-weight-light">Ready to 3D scan your object?</h3>
                <h4 className="text-secondary font-weight-light">Click "Scan a New Object"</h4>
                <img src={scanScreenIcon} alt="Scan" />
              </div>
              : ''}
          </div>
        </div>
      </div>
    );
  }
}

export const Dictaphone = ({ handleSpeech }) => {
  const { transcript, resetTranscript } = useSpeechRecognition()

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return null
  }

  SpeechRecognition.startListening()
  handleSpeech(transcript)
  // resetTranscript()
  // setTimeout(resetTranscript(), 1000)

  return (
    <div>
      {/* <button onClick={SpeechRecognition.startListening}>Start</button> */}
      <button onClick={SpeechRecognition.stopListening}>Stop</button>
      <button onClick={resetTranscript}>Reset</button>
      <p>{transcript}</p>
    </div>
  )
}

export const TodoPage = () => {
  console.log('This will run every second!');
  const [todo, setTodo] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('This will run every second!');
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
        // setTodo("data:image/jpeg;base64," + blob)
        setTodo(src)
        console.log("ok")
      })
        .catch((error) => {
          console.error('Error:', error);
        })
    }, 500);


    return () => clearInterval(interval);
  }, [todo])

  return (
    <>
      <img className="w-75 mt-4 rounded" src={todo} alt="camera feed" />
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
      isLoading: true,
    };
  }

  componentDidMount() {
    console.log("getting models");
    fetch('/models').then(response => {
      if (response.ok) {
        console.log("models ok");
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

  deleteModel(modelName) {
    let name = encodeURIComponent(modelName.trim())
    console.log(name)
    let newModels;
    fetch('/models/delete/' + name).then(response => {
      if (response.ok) {
        console.log("Model was successfuly deleted");
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
    // newModels = this.state.models.filter(
    //   function(model){ return model.name !== modelName });
    // this.setState({
    //   models: newModels,
    // })
  }
  // <img src={require( `${ model.img_url }` )} className="rounded float-left"  width="300px" height="168px" alt={model.name}/>

  render() {
    return (
      <div id="container" className="container-fluid p-3">
        <div className="row">
          <div class="col">
            <h1 className="text-left font-weight-light">My 3D Models</h1>
            {this.state.spesificModel === null ? this.state.models.reverse().map((model, index, array) => {
              return (
                <div key={index} className="m-4 p-4 border-bottom text-left">
                  <div className="row">
                    <div className="col">
                      <img src={model.img_url} className="rounded float-left" width="300px" height="168px" alt={model.name} />

                      <div className="pl-3 float-left">
                        <h3 className="font-weight-light">{model.name}</h3>
                        <ul class="list-group list-group-flush">
                          <li class="list-group-item"><button class="btn btn-primary" onClick={() => { this.setState({ spesificModel: this.state.models[array.length - 1 - index] }) }}>View 3D Model</button></li>
                          <li class="list-group-item">Scanned at {model.creation_date}</li>
                          <li class="list-group-item">Size: {model.size}</li>
                          <li class="list-group-item">Captured using {model.number_of_frames} frames</li>
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
                <div class="row">
                  <div class="col">
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
                <OBJModel src={this.state.spesificModel.model_url} alt='3D Model' width="1400" height="800"
                  onProgress={() => { this.setState({ isLoading: true }); console.log("loading") }} onLoad={() => { this.setState({ isLoading: false }); console.log("done") }} />
                {/* <DAEModel src="my_models/idan.dae" alt='3D Model' width="1400" height="800"
                  onProgress={() => { this.setState({ isLoading: true }); console.log("loading") }} onLoad={() => { this.setState({ isLoading: false }); console.log("done") }} /> */}
                {/* <MTLModel src={this.state.spesificModel} mtl="my_models/idan.mtl" alt='3D Model' width="1400" height="800"
                  onProgress={() => { this.setState({ isLoading: true }); console.log("loading") }} onLoad={() => { this.setState({ isLoading: false }); console.log("done") }} /> */}


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
      number_of_frames: props.settings['number_of_frames']
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
    if(key != "number_of_frames") {
      value = Number.parseFloat(value).toFixed(2)
    }
    console.log(value)
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
      // console.log(response.ok)
      if (response.ok) {
        return response
      }
      else {
        throw new Error('Something went wrong');
      }
    }).then(data => {
      // console.log(data)
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
    // let newSettings = this.state.settings;
    // newSettings['voice_control'] = value;
    // console.log(newSettings)
    // this.setState({
    //   settings: newSettings
    // }, console.log(this.state.settings))

    fetch('/settings/voice_control/' + new_val).then(response => {
      // console.log(response.ok)
      if (response.ok) {
        return response
      }
      else {
        throw new Error('Something went wrong');
      }
    }).then(data => {
      // console.log(data)
      this.updateSettings("voice_control", value);
    })
      .catch((error) => {
        console.error('Error:', error);
      })
  }

  render() {
    return (
      <div id="container" className="container-fluid p-3">
        <div class="row">
          <div class="col">
            <h1 className="text-left font-weight-light">Settings</h1>
            <div class="row m-4 p-4 border-bottom">
              <div class="col-3 text-right">
                <label class="form-check-label" htmlFor="voiceCapture">
                  Enable Voice Control:
                </label>
              </div>
              <div className="col-3 float-left text-left">
                <input class="form-check-input" type="checkbox" id="voice_control" onClick={this.handleVoiceControlChange} defaultChecked={this.state.settings.voice_control} />
                <small>Use Voice Control to capture frames using your voice. Whenever scanning you may say "capture" instead of pressing "capture" button.</small>
              </div>
            </div>
            <div class="row m-4 p-4 border-bottom">
              <div class="col-3 text-right">
                <label htmlFor="points">Object's Center Distance From Camera in Meters:</label>
              </div>
              <div className="col-3 float-left text-left">
                <input name="radius" type="number" id="obj_distance" step="0.01" className="form-control"
                  placeholder={this.state.settings.obj_distance} defaultValue={this.state.settings.obj_distance} onChange={this.handleObjParamsChange} ref={el => this.radius = el} required />
                <small>Accurate input will result a finer merge of all frames.</small>
              </div>
            </div>
            <div class="row m-4 p-4 border-bottom">
              <div class="col-3 text-right">
                <label htmlFor="points">Object Radius:</label>
              </div>
              <div className="col-3 float-left text-left">
                <input className="w-75 mr-2" type="range" id="obj_radius" name="points" step="0.05"
                  defaultValue={this.state.obj_radius} min="0.1" max="3" onChange={this.handleObjParamsChange} /> {this.state.obj_radius}
                <br />
                <small>Accurate input will result a finer cropping of the object from it's environment.</small>
              </div>
            </div>
            <div class="row m-4 p-4 border-bottom">
              <div class="col-3 text-right">
                <label htmlFor="points">Number of Frames:</label>
              </div>
              <div className="col-3 float-left text-left">
                <input className="w-75 mr-2" type="range" id="number_of_frames" name="points" step="2"
                  defaultValue={this.state.settings.number_of_frames} min="2" max="8" onChange={this.handleObjParamsChange} /> {this.state.number_of_frames}
                <br />
                <small>4 is the recommended number of frames.</small>
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
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
      <Container />
    </div>
  );
}

export default App;