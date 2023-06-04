---
title: Building a Live Proctoring System using Dyte
date: 2023-05-22
Time to read: 10 mins
tags: engineering, machine-learning, dyte, proctoring
---

# Building a Live Proctoring System using Dyte

## TL;DR

By the end of this tutorial, we will have built a "Live Proctoring System" using Dyte APIs that allows an admin to monitor the students in real-time and detect automatically if a student is trying to cheat during an online exam.

## Introduction

Proctoring is a method of monitoring students during an examination to prevent them from cheating. It is a common practice in offline exams where a proctor is assigned to each classroom to monitor the students. However, in the case of online exams, it is not possible to have a proctor for each student. This is where live automatic proctoring comes into the picture. It is a method of monitoring students during an online exam using a webcam and a microphone. It uses computer vision and machine learning to detect if a student is trying to cheat during an online exam. In this tutorial, we will build a live proctoring system using [Dyte](https://dyte.io/) APIs that allows an admin to monitor the students in real-time and detect if a student is trying to cheat and send them a warning message.

## Step 0: Configurations and Setup

Before we start building our proctoring system, we need to set up a Dyte account. We can create a free account by clicking on "Start Building" on [Dyte.io](https://dyte.io/) and signing up using Google or GitHub. Once we have signed up, we can access our [Dyte API keys](https://dev.dyte.io/apikeys) from the "API Keys" tab in the left sidebar. We will keep these keys secure as we will be using later.


Now, for our proctoring system, we will be using React for the frontend and FastAPI for the backend. React is a JavaScript library for building user interfaces and FastAPI is a Python framework for building APIs.

We will begin by creating a new directory for out project, called `dyte-proctoring` and navigating into it using the following commands:

```bash
mkdir dyte-proctoring
cd dyte-proctoring
```

## Step 1: Setting up the frontend

We will create a boilerplate React app using `create-react-app`. We can do this by running the following command:

```bash
yarn create react-app frontend --template typescript
```

This will initialize a new React app in the `frontend` directory.

We will install the dyte `react-web-core` and `react-ui-kit` to this project:

```bash
yarn add @dytesdk/react-web-core @dytesdk/react-ui-kit
```

Next, we will add the initial Dyte Meeting component to our app. We can do this by replacing the contents of `frontend/src/App.tsx` with the following code:

```tsx
import { DyteMeeting } from '@dytesdk/react-ui-kit';
import { useDyteClient } from '@dytesdk/react-web-core';
import { useEffect } from 'react';

function App() {
    const [meeting, initMeeting] = useDyteClient();

    useEffect(() => {
        const searchParams = new URL(window.location.href).searchParams;

        const authToken = searchParams.get('authToken');

        // pass an empty string when using v2 meetings
        // for v1 meetings, you would need to pass the correct roomName here
        const roomName = searchParams.get('roomName') || '';

        if (!authToken) {
            alert(
                "An authToken wasn't passed, please pass an authToken in the URL query to join a meeting."
            );
            return;
        }

        initMeeting({
            authToken,
            roomName,
        });
    }, []);

    // By default this component will cover the entire viewport.
    // To avoid that and to make it fill a parent container, pass the prop:
    // `mode="fill"` to the component.
    return <DyteMeeting meeting={meeting!}></DyteMeeting>;
}

export default App;
```

This component will initialize a Dyte meeting using the `authToken` (mandatory parameter) and `roomName` (optional parameter) passed in the URL query.

We can generate our own `authToken` by creating a new meeting using the [Dyte API](https://docs.dyte.io/api?v=v2#/) for different types of participants. The complete steps for generating an `authToken` can be found in the [Getting Started With Dyte](https://docs.dyte.io/getting-started) page.

To start the React app on the local server, we can run the following command:

```bash
yarn start
```

Now, upon visiting `http://localhost:3000/?authToken=<OUR-AUTH-TOKEN>`, we should be able to see the Dyte meeting in our browser.

<img src="https://github.com/thepushkarp/nalcos/assets/42088801/37a4f1a7-3901-4e7e-a690-7804dda91972">

## Step 2: Setting up the backend

Now, go back to the root directory of our project and create a new directory called `backend` using the following command:

```bash
cd ..
mkdir backend
cd backend
```

Here, create a new file named `app.py` and add the following code to it:

```python
import base64
import io
import logging

import face_recognition
import uvicorn
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)
# save logs to a file
fh = logging.FileHandler("app.log")
fh.setLevel(logging.DEBUG)
# create formatter
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
# add formatter to fh
fh.setFormatter(formatter)
# add fh to logger
logger.addHandler(fh)


class ParticipantScreen(BaseModel):
    base64_img: str
    participant_id: str


origins = [
    # allow all
    "*",
]

app = FastAPI()

# enable cors
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # allow all
    allow_headers=["*"],  # allow all
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/detect_faces/")
async def detect_faces(participant: ParticipantScreen):
    # Extract the base64 image data
    img_data = base64.b64decode(participant.base64_img.split(",")[1])

    # Convert the image data to a file object
    file_obj = io.BytesIO(img_data)

    # Read the image object
    img = face_recognition.load_image_file(file_obj)

    # Find all the faces in the image
    face_locations = face_recognition.face_locations(img)

    # If there is more than one face, return True
    if len(face_locations) > 1:
        logger.info(
            f"Detected more than one face for participant {participant.participant_id}"
        )
        return {"id": participant.participant_id, "multiple_detected": True}

    # If there is only one face, return False
    return {"id": participant.participant_id, "multiple_detected": False}


if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
```

This code defines a FastAPI application with a single endpoint `/detect_faces` which takes in a base64 encoded image and returns a boolean value indicating if there are more than one faces in the image. It uses the [face_recognition](https://github.com/ageitgey/face_recognition) library to detect faces in the image.

Now, we will create a `requirements.txt` file in the `backend` directory and add the following dependencies to it:

```txt
fastapi
uvicorn
face_recognition
numpy
python-multipart
```

We will now create a virtual environment for our project and install the dependencies using the following commands:

```bash
python -m venv venv
source venv/bin/activate # for linux/mac
venv\Scripts\activate.bat # for windows
pip install -r requirements.txt
```

Now, we can start the backend server using the following command:

```bash
uvicorn app:app --reload --port 8000
```

Here, when we hit the `/detect_faces` endpoint with an image file encoded as a base64 string, the `multiple_detected` key of the response would be set to `True` if there are more than one faces in the image, else it would be set to `False`.

We can call this from our frontend with the participant's webcam feed to detect if there are more than one faces in the frame.

## Step 3: Adding the face detection logic to the frontend

Since now we have a nice backend server to detect faces, we can add the face detection logic to our frontend. For this, we will first add some constants to our previously edited `frontend/src/App.tsx` file:

```tsx
...

// Constants
let LAST_BACKEND_PING_TIME = 0; // Last time the backend was pinged
const DETECT_FACES_ENDPOINT = 'http://localhost:8000/detect_faces'; // Endpoint to detect faces
const TIME_BETWEEN_BACKEND_PINGS = 30000; // Time between consecutive backend pings in milliseconds (30 seconds)

function App() {
...
```

We will be using the above constants in the `SendImageToBackendMiddleware` function which we will add to our `App` component, just after the `useDyteClient` hook.

The `SendImageToBackendMiddleware` is a [Dyte Video](https://dyte.io/blog/streams-blog/) [Middleware](https://docs.dyte.io/web-core/local-user/extras#using-middlewares). Middlewares are add-ons that we can use to add effects and filters to your audio and video streams with ease.

Here, we are using the middleware functionality to get the canvas object of the participant's webcam feed, convert it to a base64 encoded image and send it to our backend server. We are also ensuring that the backend is pinged only once every 30 seconds to avoid unnecessary load on the server.

We then use the `sendNotification` function to [send a notification](https://docs.dyte.io/react-ui-kit/reference#sendnotification) to the participant if the backend returns `True` for the `multiple_detected` key of the response.

The middleware code is as follows:

```tsx
...
    const [meeting, initMeeting] = useDyteClient();

    async function SendImageToBackendMiddleware() {
        return async (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
            const currentTime = Date.now();
            if (currentTime - LAST_BACKEND_PING_TIME > TIME_BETWEEN_BACKEND_PINGS) {
                LAST_BACKEND_PING_TIME = currentTime;
                const imgBase64String = canvas.toDataURL('image/png');
                const response = await fetch(DETECT_FACES_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        base64_img: imgBase64String,
                        participant_id: meeting?.self.id,
                    }),
                });
                const res = await response.json();
                if (res['multiple_detected']) {
                    console.log('Warning: Multiple faces detected!');
                    sendNotification({
                        id: 'multiple_faces_detected',
                        message: 'Warning: Multiple faces detected!',
                    });
                }
            }
        };
    }

    // @ts-ignore
    meeting?.self.addVideoMiddleware(SendImageToBackendMiddleware);

    useEffect(() => {
...
```

## Step 4: Alerting the participant when multiple faces are detected

That was all the code we needed to add a basic proctoring functionality to our Dyte meeting. The app sends a screenshot of the participant's webcam feed to the backend server every 30 seconds and if the backend detects more than one face in the image, it sends a warning notification to the participant. Additionally, the backend also logs the participant's ID and the time of the detection in the terminal. This can be used to keep track of the participants who may be cheating in the meeting, for later review.

The final React component looks like this:

```tsx
import { DyteMeeting, sendNotification } from '@dytesdk/react-ui-kit';
import { useDyteClient } from '@dytesdk/react-web-core';
import { useEffect } from 'react';

// Constants
let LAST_BACKEND_PING_TIME = 0; // Last time the backend was pinged
const DETECT_FACES_ENDPOINT = 'http://localhost:8000/detect_faces'; // Endpoint to detect faces
const TIME_BETWEEN_BACKEND_PINGS = 30000; // Time between consecutive backend pings in milliseconds (30 seconds)

function App() {
    const [meeting, initMeeting] = useDyteClient();

    async function SendImageToBackendMiddleware() {
        return async (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
            const currentTime = Date.now();
            if (currentTime - LAST_BACKEND_PING_TIME > TIME_BETWEEN_BACKEND_PINGS) {
                LAST_BACKEND_PING_TIME = currentTime;
                const imgBase64String = canvas.toDataURL('image/png');
                const response = await fetch(DETECT_FACES_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        base64_img: imgBase64String,
                        participant_id: meeting?.self.id,
                    }),
                });
                const res = await response.json();
                if (res['multiple_detected']) {
                    console.log('Warning: Multiple faces detected!');
                    sendNotification({
                        id: 'multiple_faces_detected',
                        message: 'Warning: Multiple faces detected!',
                    });
                }
            }
        };
    }

    // @ts-ignore
    meeting?.self.addVideoMiddleware(SendImageToBackendMiddleware);

    useEffect(() => {
        const searchParams = new URL(window.location.href).searchParams;

        const authToken = searchParams.get('authToken');

        // pass an empty string when using v2 meetings
        // for v1 meetings, you would need to pass the correct roomName here
        const roomName = searchParams.get('roomName') || '';

        if (!authToken) {
            alert(
                "An authToken wasn't passed, please pass an authToken in the URL query to join a meeting."
            );
            return;
        }

        initMeeting({
            authToken,
            roomName,
        });
    }, []);

    // By default this component will cover the entire viewport.
    // To avoid that and to make it fill a parent container, pass the prop:
    // `mode="fill"` to the component.
    return <DyteMeeting meeting={meeting!}></DyteMeeting>;
}

export default App;
```

## Step 5: Testing the proctoring system

<-- Mostly Screenshots here of Meeting App and the logs -->

## Conclusion

Yaay! We have successfully built a proctoring system using Dyte. We can now use this system to proctor our online exams and interviews.

Now that we have built our own proctoring system, we can use it to proctor our online exams and interviews. We can also use this system to build our own online classroom or meeting platform.

The possibilities are endless!
