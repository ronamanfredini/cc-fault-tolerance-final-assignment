import { readJson, saveJson } from '@cc-fault-tolerance/utils';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import { IDBCheck } from './interface/IDBCheck';

const app = express();
app.use(express.json());
const dbBasePaths = path.resolve('datastore');
const thisDbDatastore = path.join(dbBasePaths, process.env.DB_FILE);
const port = process.env.port || 3333;
const serverUrl = `http://localhost:${port}`;

let isMainDb = process.env.MAIN_DB === 'true';
let mainDbBaseUrl = 'http://localhost:3333';
let cluster: Array<IDBCheck> = [];
let healthInterval: NodeJS.Timeout;
let isStillALiveInterval: NodeJS.Timeout;

async function retrieveMainDbUrl() {
  try {
    const defaultMainDbIsUp = await axios.get(`${mainDbBaseUrl}/role`);
    if (defaultMainDbIsUp.data === 'master') {
      return mainDbBaseUrl;
    }
  } catch {} finally {
    let starterPort = 3000;
    for (let i = starterPort; i < 4000; i++) {
      try {
        const url = `http://localhost:${i}`;
        const isMaster = (await axios.get(`${url}/role`)).data === 'master';
        if (isMaster) {
          return url;
        }
      } catch(err) {
        continue;
      }
    }
  }

  throw new Error('No master db found');
}

async function setupSlave() {
  mainDbBaseUrl = await retrieveMainDbUrl();
  healthInterval = setInterval(function health() {
    pushHealthCheck();
    return health;
  }(), 1000);
}

function startIntervalChecks() {
  if (!isMainDb) {
    setupSlave();
  }

  isStillALiveInterval = setInterval(function checkIfDbIsStillAlive() {
    if (isMainDb) {
      console.log(`I'm master DB`, cluster);
      cluster.forEach((db, idx) => {
        const now = new Date().getTime();
        if (now - db.time > 10000) {
          // console.log(`db ${db.url} is down`);
          cluster.splice(idx, 1);
        }
      })
    }
    return checkIfDbIsStillAlive;
  }(), 500);
}

function stopIntervalChecks() {
  clearInterval(healthInterval);
  clearInterval(isStillALiveInterval);
}

startIntervalChecks();

function reclaimThePower() {
  stopIntervalChecks();
  cluster.shift();
  isMainDb = true;
  cluster.forEach((db) => {
    axios.post(`${db.url}/assign-cluster-master`, { url: serverUrl });
  })
  startIntervalChecks();
}

async function pushHealthCheck() {
  if (!isMainDb) {
    axios.post(`${mainDbBaseUrl}/health`, {
      url: serverUrl,
      time: new Date().getTime()
    })
      .then((responseData) => {
        const { data } = responseData;
        cluster = data;
      })
      .catch(() => {
        console.log('Sync failed, main db is down. Reassigning cluster master...');
        if (cluster[0].url === serverUrl) {
          reclaimThePower();
        }
      });
  }
}

function createDatastore() {
  const datastores = fs.readdirSync(dbBasePaths);
  const hasDatastoreCreated = datastores.indexOf(process.env.DB_FILE);
  if (hasDatastoreCreated === -1) {
    fs.writeFileSync(thisDbDatastore, '[]');
  }
}

createDatastore();

function getRecordFromId(id: string) {
  const data = readJson(thisDbDatastore);
  return data.find((record: any) => record.id == id);
}

function getAllRecords() {
  return readJson(thisDbDatastore);
}

app.post('/assign-cluster-master', (req, res) => {
  const { url } = req.body;
  mainDbBaseUrl = url;
  res.status(200).send('ok');
});

app.get('/role', (req, res) => {
  return res.status(200).send(isMainDb ? 'master' : 'slave');
});

app.post('/health', (req, res) => {
  const { url } = req.body;
  const db = cluster.find((db: any) => db.url === url);
  if (!db) {
    cluster.push(req.body);
  }

  res.send(cluster);
});

app.get('/:id', (req, res) => {
  const retrievedData = getRecordFromId(req.params.id);
  res.send(retrievedData);
});

app.post('/', (req, res, next) => {
  const data = req.body;

  const allRecords = getAllRecords();
  
  data.id = allRecords.length;

  allRecords.push(data);
  saveJson(thisDbDatastore, allRecords);

  res.send({ message: 'Saved' });
  next();
});

app.patch('/:id', (req, res, next) => {
  const data = req.body;
  const record = getRecordFromId(req.params.id);
  if (!record) {
    res.send('Record not found');
  }

  const newRecord = {
    ...record,
    ...data
  };
  const allRecords = getAllRecords();
  allRecords[req.params.id] = newRecord;
  saveJson(thisDbDatastore, allRecords);

  res.send({ message: 'Saved' });
  next();
});

app.delete('/:id', (req, res, next) => {
  const allRecords = getAllRecords();
  console.log(req.params.id)
  let recordIndex = -1;
  allRecords.forEach((record, idx) => {
    if (record.id == req.params.id) {
      recordIndex = idx;
    }
  });

  if (recordIndex === -1) {
    return res.send('Record not found');
  }
  allRecords.splice(recordIndex, 1);

  saveJson(thisDbDatastore, allRecords);
  res.send({ message: 'Deleted' });
  next();
});

app.put('/sync', (req, res) => {
  saveJson(thisDbDatastore, req.body);
});

app.use((req, res) => {
  const data = readJson(thisDbDatastore);

  cluster.forEach((db) => {
    axios.put(`${db.url}/sync`, data);
  });
  
  axios.put(`${mainDbBaseUrl}/sync`, data);
  console.log(cluster);

  res.end();
});

const server = app.listen(port, () => {
  console.log(`Listening at ${serverUrl}`);
});
server.on('error', console.error);
