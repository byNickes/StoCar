const StoCar = artifacts.require("StoCar");

module.exports = function (deployer) {
  deployer.deploy(StoCar, null); // Your seed!
};
