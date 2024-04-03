import { useState } from 'react';
import * as query from '@aws-sdk/client-timestream-query';
import Dashboard from './Dashboard';
import './VendEvents.css';
import './Grid.css';

function VendEvent() {
  const [items, setItems] = useState(10);
  const params = {
    DatabaseName: process.env.REACT_APP_DATABASE_NAME,
    TableName: process.env.REACT_APP_TABLE_NAME,
    MaxResults: 10,
  };
  const timestream = new query.TimestreamQueryClient({
    region: process.env.REACT_APP_REGION,
    credentials: {
      accessKeyId: process.env.REACT_APP_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_SECRET_ACCESS_KEY,
      sessionToken: null,
    },
  });
  const [events, setEvents] = useState([]);
 

  const fetchData = async (e) => {
    try {
      e.preventDefault();
      console.log(e);
      console.log(items);
      const data = await timestream.send(
        new query.QueryCommand({
          QueryString: `SELECT * FROM "${params.DatabaseName}"."${params.TableName}" ORDER BY time DESC LIMIT ${items}`,
        }),
      );
      setEvents(data.Rows);
    } catch (error) {
      console.log(error);
    }
  };

  return (

    <div>
      <Dashboard />
      <div className="table-container">
        <table style={{ paddingLeft: '50%', paddingRight: '50%' }} className="styled-table">
          <tbody>
            <th>Time</th>
            <th>Product</th>
            <th>Payment</th>
            <th>Price</th>
            {events.map((val, key) => (

              <tr>
                
                  <td>{val.Data[3].ScalarValue}</td>
                  
                  <td>{val.Data[0].ScalarValue}</td>
                  
                  <td>{val.Data[1].ScalarValue}</td>
    
                  <td>{val.Data[5].ScalarValue}</td>
                </tr>
            ))}
          </tbody>
        </table>
        <div>
          <form style={{ paddingLeft: '50%', paddingRight: '50%' }} onSubmit={(e) => fetchData(e)}>
            <input type="number" min="1" max="100" onChange={(e) => setItems(e.target.value)} />
            <button>Get</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default VendEvent;
