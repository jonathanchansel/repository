/*

TO-DO (in no particular order)

 - investigate and fix why animations are gridded with decimal camera zooms
 - investigate and implement the ability for the camera to zoom on an artif
   ical point in screen space
 - investigate and fix why dango will stop on cursor but not change to fron
   t facing animation

*/

const canvas = document.querySelector('canvas');

var positionDiv = document.getElementById("position");
const context = canvas.getContext("2d");

canvas.style.backgroundColor = 'Fuchsia';

let mouse = {x: 0, y: 0, down: false};
let lastMouse = {x: 0, y:0};

let drawObjects = [];

var keys = {};

class Text
{
  text = [];

  color;
  size;
  font;

  bottomLeftX;
  bottomLeftY;

  maxWidth;

  constructor(text, color, size, font, topLeftX, topLeftY, maxWidth)
  {
    this.color = color;
    this.size = size;
    this.font = font;

    this.topLeftX = topLeftX;
    this.topLeftY = topLeftY;

    this.maxWidth = maxWidth;

    this.set(text);

    drawObjects.push(this);
  }

  set(text)
  {
    this.text = [];

    for (let substringIterate = 0;
         substringIterate < text.length;
         substringIterate += this.maxWidth)
    {
      this.text.push(text.slice(substringIterate, substringIterate + this.maxWidth));
    }
  }

  draw()
  {
    context.fillStyle = this.color;
    context.font = (this.size + "px " + this.font);

    for (let iterate = 0; iterate < this.text.length; iterate++)
    {
      context.fillText(this.text[iterate],
                       this.topLeftX,
                       this.topLeftY + iterate*this.size);
    }
  }
}

class Camera
{
  x;
  y;

  velocity;

  zoom;
  zoomSpeed;
  zoomVelocityDelta;

  constructor(x, y, initialVelocity, initialZoom, zoomSpeed, zoomVelocityDelta)
  {
    this.velocity = initialVelocity;

    this.zoom = initialZoom;
    this.zoomSpeed = zoomSpeed;
    this.zoomVelocityDelta = zoomVelocityDelta;

    let convertedCoordinates = screenToWorld(canvas.width, canvas.height, 0, 0, this.zoom);

    this.x = x - convertedCoordinates[0]/2;
    this.y = y - convertedCoordinates[1]/2;
  }

  move(x, y)
  {
    this.x += x;
    this.y -= y;
  }

  /*
  changeZoom(deltaZoom, x, y)
  {
    this.zoom += deltaZoom;
    this.velocity = this.zoomVelocityDelta/this.zoom;

    this.x -= -x*this.zoomSpeed;
    this.y += -y*this.zoomSpeed;
  }
  //*/

  setZoom(deltaZoom)
  {
    this.zoom += deltaZoom;
  }
}

class Animation
{
  topLeftX;
  topLeftY;

  height;
  width;

  scale;

  frames;
  frameIndex;

  pixelSize;

  constructor(topLeftX, topLeftY, height, width, scale, frameIndex, pixelSize)
  {
    // initialize variables
    this.topLeftX = topLeftX;
    this.topLeftY = topLeftY;

    this.height = height;
    this.width = width;

    this.scale = scale;

    this.frames = [];
    this.frameIndex = frameIndex;

    this.pixelSize = pixelSize;

    // add as draw obkect
    drawObjects.push(this);
  }

  insertFrame(index)
  {
    // add transparent characters to create an empty row
    let emptyRow = [];

    for (let columnIterate = 0;
         columnIterate < this.width;
         ++columnIterate)
    {
      emptyRow.push("-");
    }

    // add empty rows to create an empty frame
    let emptyFrame = [];

    for (let rowIterate = 0;
         rowIterate < this.height;
         ++rowIterate)
    {
      emptyFrame.push(emptyRow.slice());
    }

    // add empty frame to array of frames
    this.frames.splice(index, 0, emptyFrame.slice());
  }

  draw()
  {
    for (let rowIterate = 0;
         rowIterate < this.height;
         ++rowIterate)
    {
      for (let columnIterate = 0;
           columnIterate < this.width;
           ++columnIterate)
      {
        if (this.frames[this.frameIndex][rowIterate][columnIterate] != "-")
        {
          context.fillStyle = this.frames[this.frameIndex][rowIterate][columnIterate];

          context.fillRect((this.topLeftX - camera.x + this.pixelSize*this.scale*columnIterate)*camera.zoom,
                           (this.topLeftY - camera.y + this.pixelSize*this.scale*rowIterate)*camera.zoom,
                           (this.pixelSize*camera.zoom*this.scale + 1),
                           (this.pixelSize*camera.zoom*this.scale + 1));
        }
      }
    }
  }
}

let camera = new Camera(200, 200, 8, 1, 0.2, 16);

/*
let dangoAnimation = new Animation(200, 200, 13, 16, 1, 0, 10);

dangoAnimation.insertFrame(0);
dangoAnimation.insertFrame(0);
dangoAnimation.insertFrame(0);
dangoAnimation.insertFrame(0);

// idle, content
dangoAnimation.frames[0] = [ ["-",       "-",       "-",       "-",       "-",       "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "-",       "-",       "-",       "-",       "-"      ],
                             ["-",       "-",       "-",       "#000000", "#000000", "#ffb8c4", "#ffb8c4", "#ffb8c4", "#ffb8c4", "#ffb8c4", "#ffb8c4", "#000000", "#000000", "-",       "-",       "-"      ],
                             ["-",       "-",       "#000000", "#ffb8c4", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#ffb8c4", "#000000", "-",       "-"      ],
                             ["-",       "#000000", "#ffb8c4", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#000000", "#ffa3b1", "#ffa3b1", "#000000", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#ffb8c4", "#000000", "-"      ],
                             ["-",       "#000000", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#000000", "#ffa3b1", "#ffa3b1", "#000000", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#000000", "-"      ],
                             ["-",       "#000000", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#000000", "#ffa3b1", "#ffa3b1", "#000000", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#000000", "-"      ],
                             ["#000000", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#000000"],
                             ["#000000", "#ffa3b1", "#ffa3b1", "#ed1c23", "#ed1c23", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ed1c23", "#ed1c23", "#ffa3b1", "#ffa3b1", "#000000"],
                             ["#000000", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#000000"],
                             ["#000000", "#ff8c9f", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ff8c9f", "#000000"],
                             ["-",       "#000000", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#000000", "-"      ],
                             ["-",       "-",       "#000000", "#000000", "#000000", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#000000", "#000000", "#000000", "-",       "-"      ],
                             ["-",       "-",       "-",       "-",       "-",       "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "-",       "-",       "-",       "-",       "-"      ]  ];
// back
dangoAnimation.frames[1] = [ ["-",       "-",       "-",       "-",       "-",       "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "-",       "-",       "-",       "-",       "-"      ],
                             ["-",       "-",       "-",       "#000000", "#000000", "#ffb8c4", "#ffb8c4", "#ffb8c4", "#ffb8c4", "#ffb8c4", "#ffb8c4", "#000000", "#000000", "-",       "-",       "-"      ],
                             ["-",       "-",       "#000000", "#ffb8c4", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#ffb8c4", "#000000", "-",       "-"      ],
                             ["-",       "#000000", "#ffb8c4", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#ffb8c4", "#000000", "-"      ],
                             ["-",       "#000000", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#000000", "-"      ],
                             ["-",       "#000000", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#000000", "-"      ],
                             ["#000000", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#000000"],
                             ["#000000", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#000000"],
                             ["#000000", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#000000"],
                             ["#000000", "#ff8c9f", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ff8c9f", "#000000"],
                             ["-",       "#000000", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#000000", "-"      ],
                             ["-",       "-",       "#000000", "#000000", "#000000", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#000000", "#000000", "#000000", "-",       "-"      ],
                             ["-",       "-",       "-",       "-",       "-",       "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "-",       "-",       "-",       "-",       "-"      ]  ];
// look right
dangoAnimation.frames[2] = [ ["-",       "-",       "-",       "-",       "-",       "-",       "-",       "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "-",       "-",       "-"      ],
                             ["-",       "-",       "-",       "-",       "-",       "#000000", "#000000", "#ffb8c4", "#ffb8c4", "#ffb8c4", "#ffb8c4", "#ffb8c4", "#ffb8c4", "#000000", "-",       "-"      ],
                             ["-",       "-",       "-",       "-",       "#000000", "#ffb8c4", "#ffb8c4", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#000000", "-"      ],
                             ["-",       "-",       "-",       "#000000", "#ffb8c4", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#000000", "#ffa3b1", "#ffa3b1", "#000000", "#ffa3b1", "#ffb8c4", "#000000"],
                             ["-",       "-",       "#000000", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#000000", "#ffa3b1", "#ffa3b1", "#000000", "#ffa3b1", "#ffa3b1", "#000000"],
                             ["-",       "#000000", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#000000", "#ffa3b1", "#ffa3b1", "#000000", "#ffa3b1", "#ffa3b1", "#000000"],
                             ["-",       "#000000", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#000000"],
                             ["#000000", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ed1c23", "#ed1c23", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ed1c23", "#000000"],
                             ["#000000", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#000000"],
                             ["#000000", "#ff8c9f", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ff8c9f", "#000000"],
                             ["-",       "#000000", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#000000", "-"      ],    
                             ["-",       "-",       "#000000", "#000000", "#000000", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#000000", "#000000", "#000000", "-",       "-"      ],
                             ["-",       "-",       "-",       "-",       "-",       "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "-",       "-",       "-",       "-",       "-"      ]  ];
// look left
dangoAnimation.frames[3] = [ ["-",       "-",       "-",       "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "-",       "-",       "-",       "-",       "-",       "-",       "-"      ],
                             ["-",       "-",       "#000000", "#ffb8c4", "#ffb8c4", "#ffb8c4", "#ffb8c4", "#ffb8c4", "#ffb8c4", "#000000", "#000000", "-",       "-",       "-",       "-",       "-"      ],
                             ["-",       "#000000", "#ffb8c4", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#ffb8c4", "#ffb8c4", "#000000", "-",       "-",       "-",       "-"      ],
                             ["#000000", "#ffb8c4", "#ffa3b1", "#000000", "#ffa3b1", "#ffa3b1", "#000000", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#ffb8c4", "#000000", "-",       "-",       "-"      ],
                             ["#000000", "#ffa3b1", "#ffa3b1", "#000000", "#ffa3b1", "#ffa3b1", "#000000", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#000000", "-",       "-"      ],
                             ["#000000", "#ffa3b1", "#ffa3b1", "#000000", "#ffa3b1", "#ffa3b1", "#000000", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#000000", "-"      ],
                             ["#000000", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#000000", "-"      ],
                             ["#000000", "#ed1c23", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ed1c23", "#ed1c23", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffb8c4", "#000000"],
                             ["#000000", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#000000"],
                             ["#000000", "#ff8c9f", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ff8c9f", "#000000"],
                             ["-",       "#000000", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ffa3b1", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#000000", "-"      ],
                             ["-",       "-",       "#000000", "#000000", "#000000", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#ff8c9f", "#000000", "#000000", "#000000", "-",       "-"      ],
                             ["-",       "-",       "-",       "-",       "-",       "#000000", "#000000", "#000000", "#000000", "#000000", "#000000", "-",       "-",       "-",       "-",       "-"      ]  ];
// stretch up
// stretch right
// strech left
// squish
//*/

// let mouseXtext = new Text("mouse.x: ", "White", 15, "Arial", 15, 30, 100);
// let mouseYtext = new Text("mouse.y: ", "White", 15, "Arial", 15, 45, 100);
// let zoomText = new Text("camera.zoom: ", "White", 15, "Arial", 15, 60, 100);

let xAnimation = new Animati
document.addEventListener("mousemove", function(event)
{
  const rect = canvas.getBoundingClientRect();

  mouse.x = (event.clientX - rect.left);
  mouse.y = (event.clientY - rect.top);
});

canvas.addEventListener('mousedown', function(event)
{
  mouse.down = true;
});

canvas.addEventListener('mouseup', function(event)
{
  mouse.down = false;
});

document.addEventListener('keydown', (event) =>
{
  keys[event.code] = true;
});

document.addEventListener('keyup', (event) =>
{
  keys[event.code] = false;
});

function draw()
{
  context.clearRect(0, 0, canvas.width, canvas.height);

  for (let objectIterate = 0;
       objectIterate < drawObjects.length;
       objectIterate++)
  {
    drawObjects[objectIterate].draw();
  }
}

function randomInteger(lowerBound, upperBound)
{
  return Math.floor(Math.random()*(upperBound - lowerBound + 1)) + lowerBound;
}

function input()
{
  if (keys["KeyW"])
  {
    camera.move(0, camera.velocity);
  }

  if (keys["KeyS"])
  {
    camera.move(0, -camera.velocity);
  }

  if (keys["KeyD"])
  {
    camera.move(camera.velocity, 0);
  }

  if (keys["KeyA"])
  {
    camera.move(-camera.velocity, 0);
  }

  if (keys["KeyQ"])
  {
    midpoint0 = screenToWorld(600, 300, camera.x, camera.y, camera.zoom);

    camera.setZoom(camera.zoom*camera.zoomSpeed);

    midpoint1 = screenToWorld(600, 300, camera.x, camera.y, camera.zoom);

    camera.move((midpoint0[0] - midpoint1[0]),
                -(midpoint0[1] - midpoint1[1]));
  }

  if (keys["KeyE"])
  {
    midpoint0 = screenToWorld(600, 300, camera.x, camera.y, camera.zoom);

    camera.setZoom(-camera.zoom*camera.zoomSpeed);

    midpoint1 = screenToWorld(600, 300, camera.x, camera.y, camera.zoom);

    camera.move((midpoint0[0] - midpoint1[0]),
                -(midpoint0[1] - midpoint1[1]));
  }
}

function randomColor()
{
  let newColor = "#";

  let palette = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];

  for (let letterIterate = 0;
       letterIterate < 6;
       ++letterIterate)
  {
    newColor += palette[randomInteger(0, 15)];
  }

  return newColor;
}

function screenToWorld(mouseX, mouseY, cameraX, cameraY, zoom)
{
  return [(cameraX + (mouseX)*(1/zoom)), 
          (cameraY + (mouseY)*(1/zoom))];
}

function update()
{
  /////////////////
  ////  input  ////
  /////////////////

  input();

  //////////////////
  ////  update  ////
  //////////////////

  ////  drag to move

  // set first mouse point
  if (keys["Digit1"])
  {
    camera.move(10, 0);
  }

  // set second mouse point
  if (keys["Digit2"])
  {
    camera.move(-10, 0);
  }

  // calculate and move camera based on mouse movement
  if (keys["Space"])
  {
    camera.move(0, 10);
  }

  ////  move dango
  /*
  let dangoSpeed = dangoAnimation.pixelSize*1.5;

  let midDangoX = (dangoAnimation.topLeftX + 0.5*dangoAnimation.width*dangoAnimation.pixelSize);
  let midDangoY = (dangoAnimation.topLeftY + 0.5*dangoAnimation.width*dangoAnimation.pixelSize);

  let convertedCoordinates = screenToWorld(mouse.x, mouse.y,
                                          camera.x, camera.y, camera.zoom);

  if (midDangoY < (convertedCoordinates[1] - dangoSpeed))
  {
    dangoAnimation.frameIndex = 0;
    dangoAnimation.topLeftY += dangoSpeed;
  }

  else if (midDangoY > (convertedCoordinates[1] + dangoSpeed))
  {
    dangoAnimation.frameIndex = 1;
    dangoAnimation.topLeftY -= dangoSpeed;
  }

  if (midDangoX < (convertedCoordinates[0] - dangoSpeed))
  {
    dangoAnimation.frameIndex = 2;
    dangoAnimation.topLeftX += dangoSpeed;
  }

  else if (midDangoX > (convertedCoordinates[0] + dangoSpeed))
  {
    dangoAnimation.frameIndex = 3;
    dangoAnimation.topLeftX -= dangoSpeed;
  }

  if (midDangoX > (convertedCoordinates[0] - dangoSpeed) &&
      midDangoX < (convertedCoordinates[0] + dangoSpeed) &&
      midDangoY > (convertedCoordinates[1] - dangoSpeed) &&
      midDangoY < (convertedCoordinates[1] + dangoSpeed))
  {
    dangoAnimation.frameIndex = 0;
  }
  //*/
}

const drawInterval = setInterval(update, 100);
const updateInterval = setInterval(draw, 100);
