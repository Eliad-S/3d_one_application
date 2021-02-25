import React from 'react';
import logo from './logo.svg';
import './App.css';
import './bootstrap-4.3.1-dist/css/bootstrap.min.css';
import scanScreenIcon from './images/camera_enhance-black-48dp.svg';
import ModelsScreenIcon from './images/book-black-48dp.svg';
import settingsScreenIcon from './images/settings-black-48dp.svg';



class Container extends React.Component {
  constructor(props) {
    super(props);
    this.handleMenuButtonClick = this.handleMenuButtonClick.bind(this);
    this.renderScreens = this.renderScreens.bind(this);
    this.state = {
      current_screen: "scan",
    };
  }

  handleMenuButtonClick(clickedButton) {
    this.setState({
      current_screen: clickedButton,
    });
  }

  renderScreens() {
    if(this.state.current_screen === "scan") {
      return(
        <ScanScreen />
      );
    }
    if(this.state.current_screen === "my3DModels") {
      return(
        <div className="p-3">
          <h1 className="text-left">My 3D Models</h1>
        </div>
      );
    }
    if(this.state.current_screen === "settings") {
      return(
        <div className="p-3">
          <h1 className="text-left">Settings</h1>
        </div>
      );
    }
  }

  render() {
    return(
      <div id="container" className="container-fluid">
        <div className="row pt-3">
          <div className="col">
          <div className="container-fluid">
            <Menu onChildClick={this.handleMenuButtonClick}/>
          </div>
          </div>
          <div className="col-10 w-100 shadow-sm mb-3 p-3 bg-white rounded">
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

  renderMenuButton(name, icon, id) {
    return(
      <div className="row">
        {this.state.pressed_button === id ? 
        <button id={id} type="button" className="btn btn-primary btn-lg w-100 shadow-sm mb-3 rounded font-weight-light"
        onClick={this.buttonClick}>
          {name}
          <br />
          <img id={id} src={icon} alt={id}/>
        </button>
        :
        <button id={id} type="button" className="btn btn-light btn-lg w-100 shadow-sm mb-3 bg-white rounded font-weight-light"
        onClick={this.buttonClick}>
          {name}
          <br />
          <img id={id} src={icon} alt={id} />
        </button>}

      </div>
    );
  }

  render() {
    return(
    <div>
      <h1 className="font-weight-light">3D One</h1>
      {this.renderMenuButton("Scan", scanScreenIcon, "scan")}
      {this.renderMenuButton("My 3D Models", ModelsScreenIcon, "my3DModels")}
      <div>
        {this.renderMenuButton("Settings", settingsScreenIcon, "settings")}
      </div>
    </div>);
  }
}

class ScanScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentlyScanning: false,
    };
    this.scanning = this.scanning.bind(this);
  }

  scanning() {
    this.setState({
      currentlyScanning: !this.state.currentlyScanning,
    });
  }

  render() {
    return(
      <div id="container" className="container-fluid p-3">
        <div class="row">
          <div class="col">
            <h1 className="text-left font-weight-light">Scan</h1>
          </div>
          <div className="float-right">
          {this.state.currentlyScanning ?
          <button type="button" class="btn btn-danger" onClick={this.scanning}>Cancel Scan</button>
          : 
            <button type="button" class="btn btn-success" onClick={this.scanning}>Scan a New Object</button>
          }
          </div>
        </div>
        <div className="row">
          <div className="col pt-5">
            {this.state.currentlyScanning ?
            "png"
            :
            <div>
              <h5 className="text-secondary font-weight-light">Ready to 3D scan your object?</h5>
              <h6 className="text-secondary font-weight-light">Click "Scan a New Object"</h6>
              <img src={scanScreenIcon} />
            </div>
            }
          </div>
        </div>
      

      
    </div>
    );
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
