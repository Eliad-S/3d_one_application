import React, { useState, useEffect, useRef } from "react";
import scanScreenIcon from "./images/camera_icon.svg";
import scanScreenIconWhite from "./images/camera_icon_white.svg";
import ModelsScreenIcon from "./images/models_icon.svg";
import ModelsScreenIconWhite from "./images/models_icon_white.svg";
import settingsScreenIcon from "./images/settings_icon.svg";
import settingsScreenIconWhite from "./images/settings_icon_white.svg";

export default class Menu extends React.Component {
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
        {this.state.pressed_button === id ? (
          <button
            id={id}
            type="button"
            className="btn btn-primary btn-lg w-100 shadow-sm mb-3 rounded font-weight-light nav-item menu-button"
            onClick={this.buttonClick}
          >
            <img id={id} src={iconWhite} alt={id} />
            <br />
            {name}
          </button>
        ) : (
          <button
            id={id}
            type="button"
            className="btn btn-light btn-lg w-100 shadow-sm mb-3 bg-white rounded font-weight-light nav-item menu-button"
            onClick={this.buttonClick}
          >
            <img id={id} src={icon} alt={id} />
            <br />
            {name}
          </button>
        )}
      </>
    );
  }

  render() {
    return (
      <nav className="navbar navbar-expand-md navbar-dark col card shadow pt-3 fixed-left menu-bg-color">
        <div className="collapse navbar-collapse" id="navbarsExampleDefault">
          <h1 className="font-weight-light blue">3D One</h1>
          <ul className="navbar-nav">
            {this.renderMenuButton(
              "Scan",
              scanScreenIcon,
              scanScreenIconWhite,
              "scan"
            )}
            {this.renderMenuButton(
              "My 3D Models",
              ModelsScreenIcon,
              ModelsScreenIconWhite,
              "my3DModels"
            )}
            <div className="">
              {this.renderMenuButton(
                "Settings",
                settingsScreenIcon,
                settingsScreenIconWhite,
                "settings"
              )}
            </div>
          </ul>
        </div>
      </nav>
    );
  }
}
