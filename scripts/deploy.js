const hre = require("hardhat");

async function main() {
  const Assessment = await hre.ethers.getContractFactory("DeBountyManager");
  const assessment = await Assessment.deploy();

  console.log("Deploying contract...");

  await assessment.waitForDeployment(); // ✔ replaces deployed()

  const contractAddress = await assessment.getAddress(); // ✔ replaces .address

  console.log("Contract deployed at:", contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
