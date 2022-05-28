/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { readJson, saveJson } from '@cc-fault-tolerance/utils';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';

const app = express();
app.use(express.json());
const dbBasePaths = path.resolve('datastore');
const thisDbDatastore = path.join(dbBasePaths, process.env.DB_FILE);

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

app.get('/:id', (req, res) => {
  const retrievedData = getRecordFromId(req.params.id);
  res.send(retrievedData);
});

app.post('/', (req, res) => {
  const data = req.body;

  const allRecords = getAllRecords();
  
  data.id = allRecords.length;

  allRecords.push(data);
  saveJson(thisDbDatastore, allRecords);

  res.send({ message: 'Saved' });
});

app.patch('/:id', (req, res) => {
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
});

app.delete('/:id', (req, res) => {
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
});

const port = process.env.port || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
