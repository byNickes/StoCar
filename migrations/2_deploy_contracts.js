const StoCar = artifacts.require("StoCar");

module.exports = function (deployer) {
  //set starting tax here
  deployer.deploy(StoCar, 1e15); // Your seed!
};
