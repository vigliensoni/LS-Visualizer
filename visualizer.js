const ROWS = 30
const COLS = 30
const LOOP_DURATION = 96
const NUM_DRUM_CLASSES = 9
const INST_SIDE = Math.sqrt(NUM_DRUM_CLASSES) // 3 - SIDE OF THE INSTRUMENT CUBE
const Px = 10


// CREATING AN LS MATRIX (similar to matrix1)
// one onset for each instrument at t = 0
const matLength = NUM_DRUM_CLASSES * LOOP_DURATION * COLS * ROWS
const LSMatrix = new Float32Array(matLength) 


// ///////////////////////////////////////
// SYNTHETIC DATA
// fill the space with 1's by user-provided row, column, instrument, and time
// ///////////////////////////////////////
function createSynthData(r, c, i, t) {
  LSMatrix[(r * COLS * NUM_DRUM_CLASSES * LOOP_DURATION) + (c * NUM_DRUM_CLASSES * LOOP_DURATION) + (i * LOOP_DURATION) + t] = 1 // R 1st
}

for (let row = 0; row < ROWS; row++ ){
  for (let col = 0; col < COLS; col++ ){
    for (let inst = 0; inst < NUM_DRUM_CLASSES; inst++){
      for (let time = 0; time < LOOP_DURATION; time++){
        createSynthData(row, col, inst, time)
      }
    }
  }
}

// ///////////////////////////////////////
// LOADING DATA FROM MODEL
// Load data from a pre-trained model. To be used instead of synthetic data
// ///////////////////////////////////////
let url = 'https://raw.githubusercontent.com/vigliensoni/R-VAE/master/data/trap_all_files.model/model_202062_172427.model-matrix.data'

async function getMatrix(url) {
  return fetch(url).then(response => response.arrayBuffer())
    .then(buffer => { 
      return new Float32Array(buffer, 0, buffer.byteLength / Float32Array.BYTES_PER_ELEMENT); 
    });
  }

// ///////////////////////////////////////
// CONVERT MATRIX DATA FROM MODEL FOR VISUALIZATION
// ///////////////////////////////////////
(async () => {
  let LSMatrix = await getMatrix(url);

  let matrix2 = new Float32Array(ROWS * INST_SIDE * COLS * INST_SIDE * LOOP_DURATION) 

  let counter = 0;
  for (let t = 0; t < LOOP_DURATION; t++) {
      for (let r = 0; r < ROWS; r++) {
          for (let i2 = 0; i2 < INST_SIDE; i2++) {
              for (let c = 0; c < COLS; c++) {
                  for (let i1 = 0; i1 < INST_SIDE; i1++) {
                      let pos = ( i1 * LOOP_DURATION  ) + 
                              ( c * NUM_DRUM_CLASSES * LOOP_DURATION ) + 
                              ( i2 * LOOP_DURATION * INST_SIDE  ) +  
                              ( r * NUM_DRUM_CLASSES * LOOP_DURATION * COLS ) + 
                              t
                      matrix2[counter] = LSMatrix[pos]
                      counter++
                  }
              }
          }
      }
  }
  
  
  // ///////////////////////////////////////
  // SCALE THE MATRIX TO ANY DESIRED SIZE
  // Scaling factor is given by Px. Image is converted to Uint8ClampedArray
  // ///////////////////////////////////////
  let matrix3 = new Uint8ClampedArray(ROWS * INST_SIDE * COLS * INST_SIDE * LOOP_DURATION * Px * Px * 4) // Four bytes (R, G, B, A)
  
  
  function scaleMatrix(t, r, c, pos, val) {
    // scale the matrix given the factor Px
      for(let y = 0; y < Px; y++) {
        for(let x = 0; x < Px; x++) {
          let idx = x * 4 + 
                  y * ( 4 * COLS * INST_SIDE * Px ) + 
                  r * ( 4 * COLS * INST_SIDE * Px * Px) + 
                  c * ( Px * 4 ) + 
                  t * ( COLS * INST_SIDE * ROWS * INST_SIDE * Px * Px * 4 )
          if (val >= 0 && pos%INST_SIDE == 0) matrix3.set([val*255, 0, 0, 255], idx)
          else if (val >= 0 && pos%INST_SIDE == 1) matrix3.set([0, val*255, 0, 255], idx) 
          else if (val >= 0 && pos%INST_SIDE == 2) matrix3.set([0, 0, val*255, 255], idx)
          
        }
      }
    }
  
  // Iterate over all points
  for(let t = 0; t < LOOP_DURATION; t++) {
    for(let r = 0; r < ROWS * INST_SIDE; r++) {
      for(let c = 0; c < COLS * INST_SIDE; c++) {
          let pos = r * COLS * INST_SIDE + c + t * ROWS * INST_SIDE * COLS * INST_SIDE
          let val = matrix2[pos]
          scaleMatrix(t, r, c, pos, val)
      }
    }
  }
  

  let time = 0
  // VISUALIZE MATRIX
  function visualize(t) {
    
    let canvas = document.getElementById("vis")
    let ctx = canvas.getContext('2d')
    const height = ROWS * INST_SIDE * Px
    const width = COLS * INST_SIDE * Px
    canvas.width = width
    canvas.height = height
  
    let from = width * height * 4 * (t + 0)
    let to = width * height * 4 * (t + 1)
    let idata = ctx.createImageData(width, height)
    idata.data.set(matrix3.slice(from, to))
    ctx.putImageData(idata,0,0)
  
    timetag.innerText = "t:" + t + " f:" + from + " t:" + (to-1)
    time++
  }
  


  let timetag = document.getElementById("timetag")

  // visualize(time)
  window.addEventListener("load", () =>{ visualize(0) }, false )
  timetag.addEventListener("click", () =>{ visualize(time) }, false )

  while (true) {
    for (let t=0; t < 96; t++){
      visualize(t)
      await new Promise(r => setTimeout(r, 15.625));
    }
  }



})();


