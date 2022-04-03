import axios from 'axios';
import sushi from 'sushiswap-api';
import 'dotenv/config';

const apiToken = process.env.API_TOKEN;
const contractAddress = "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f";

const url = `https://api.etherscan.io/api?module=account&action=tokentx&address=${contractAddress}&page=1&offset=1000&sort=desc&apikey=${apiToken}`;

const startTime = new Date("2022-01-01T00:00:00Z");

const transs = (await axios.get(url)).data.result;

const contractNameMap = new Map();

async function getWalletNameTag(address) {
  async function impl(address) {
    try {
      if (address === contractAddress)
        return "Router";
      const res = await sushi.getPair(1, address);
      if (res.error === "No data available")
        return "Unknown";
      // console.log(res);
      return `${res[0].Token_1_symbol}-${res[0].Token_2_symbol}`;
    } catch (e) {
      return "Error";
    }
  }

  if (contractNameMap.has(address))
    return contractNameMap.get(address);

  const name = await impl(address);
  contractNameMap.set(address, name);
  return name;
}

const record = new Map();

function addRecord(key, direction, value) {
  if (!record.has(key)) record.set(key, { "in": 0, "in_cnt": 0, "out": 0, "out_cnt": 0 });

  const stat = record.get(key);
  stat[direction] += value;
  stat[`${direction}_cnt`] += 1;
  record.set(key, stat);
}

for (const trans of transs) {
  const {
    from,
    to,
    contractAddress,
    value,
    tokenSymbol,
    tokenDecimal,
  } = trans;

  const totalValue = parseInt(value) * Math.pow(10, -parseInt(tokenDecimal));

  const fromName = await getWalletNameTag(from);
  const toName = await getWalletNameTag(to);

  const direction = fromName === "Router" ? "out" : "in";
  const opposite = fromName === "Router" ? toName : fromName;

  if (opposite === "Unknown") continue;

  // console.log({ from, to, contractAddress, value, tokenSymbol, tokenDecimal });
  console.log(direction, opposite, tokenSymbol, totalValue);
  const key = `${opposite} ${tokenSymbol}`;
  addRecord(key, direction, totalValue);
}

console.log(record);
