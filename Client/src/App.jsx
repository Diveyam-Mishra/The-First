import react from 'react';
import { io } from 'socket.io-client';


const App=()=> {

const socket= io("http://localhost:8080")

  return <div>
              Kuch toh show ho
         </div>;
};

export default App
