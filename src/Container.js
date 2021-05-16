import React, { useState, useEffect, useRef } from "react";
import ScanScreen from "./ScanScreen";
import My3DModelsScreen from "./My3DModelsScreen";
import SettingsScreen from "./SettingsScreen";
import Menu from "./Menu";

export default class Container extends React.Component {
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
    if (this.state.settings !== null) {
      return;
    }
    fetch("/settings")
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Something went wrong");
        }
      })
      .then((data) => {
        this.setState({
          settings: data,
        });
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  handleMenuButtonClick(clickedButton) {
    fetch("/settings")
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Something went wrong");
        }
      })
      .then((data) => {
        if (this.state.settings["last_object"] !== data["last_object"]) {
          this.setState({
            settings: data,
          });
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    this.setState({
      current_screen: clickedButton,
    });
  }

  updateSettings(key, value) {
    let newSettings = this.state.settings;
    newSettings[key] = value;
    this.setState({
      settings: newSettings,
    });
  }

  renderScreens() {
    if (this.state.current_screen === "scan") {
      return <ScanScreen settings={this.state.settings} />;
    }
    if (this.state.current_screen === "my3DModels") {
      return <My3DModelsScreen />;
    }
    if (this.state.current_screen === "settings") {
      return (
        <SettingsScreen
          onChildClick={this.updateSettings}
          settings={this.state.settings}
        />
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
          <div className="col-12 w-100">{this.renderScreens()}</div>
        </div>
      </div>
    );
  }
}
