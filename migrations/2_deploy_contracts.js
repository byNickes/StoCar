const StoCar = artifacts.require("StoCar");

module.exports = function (deployer) {
  deployer.deploy(StoCar, 50); // Your seed!
};
