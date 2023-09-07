import { Button, Grid, TextField, Typography } from "@mui/material";
import { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";

const HomePage = () => {
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [input, setInput] = useState<string>("");
  const [image, _] = useState<ImageData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await tf.loadLayersModel("model.json");
        setModel(loadedModel);
      } catch (error) {
        console.error("Error loading model:", error);
      }
    };
    loadModel();
  }, []);

  useEffect(() => {
    if (canvasRef.current && image) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.putImageData(image, 0, 0);
      }
    }
  }, [image]);

  let lastX = 0; // Initialize this variable outside your function

  const generateImage = async () => {
    if (model && input !== "") {
      const numDigits = input.length;
      const scalingFactor = 6;
      const imageWidth = 28 * scalingFactor;
      const gap = 0;
      if (canvasRef.current) {
        canvasRef.current.width = (imageWidth + gap) * numDigits;
      }
      for (const strDigit of input.split("")) {
        const digit = parseInt(strDigit);
        const noise = tf.randomNormal([1, 100]);
        const label = tf.oneHot([digit], 10);

        const generatedImage = model.predict([noise, label]) as tf.Tensor;

        // Remove dimensions of size 1
        const imageTensor = generatedImage.squeeze();

        // Flatten the tensor and convert to array
        const flatArray = Array.from(
          await imageTensor.flatten().data()
        ) as number[];

        const uint8Array = new Uint8ClampedArray(
          flatArray.map((x) => (x + 1) * 127.5)
        );
        const expandedArray = new Uint8ClampedArray(3136);
        for (let i = 0; i < 784; i++) {
          const value = uint8Array[i];
          expandedArray[i * 4] = value; // R
          expandedArray[i * 4 + 1] = value; // G
          expandedArray[i * 4 + 2] = value; // B
          expandedArray[i * 4 + 3] = 255; // A (opaque)
        }

        const newImageData = new ImageData(expandedArray, 28, 28);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.putImageData(newImageData, lastX, 0);

            ctx.drawImage(
              canvas,
              lastX,
              0,
              28,
              28,
              lastX,
              0,
              28 * scalingFactor,
              28 * scalingFactor
            );

            lastX += imageWidth + gap;
          }
        }
      }
    }
  };

  return (
    <Grid
      container
      height="106vh"
      direction="column"
      alignItems="center"
      justifyContent="center"
      spacing={5}
      sx={{ backgroundColor: "#000000" }}
    >
      <Grid item>
        <Typography variant="h2" color="blue">
          Digit Input to Digit Handwriting
        </Typography>
      </Grid>
      <Grid item>
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={3}
        >
          <Grid item>
            <TextField
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              sx={{
                backgroundColor: "white",
                "& .MuiFilledInput-root": { backgroundColor: "white" },
              }}
            />
          </Grid>
          <Grid item>
            <Button
              sx={{ color: "blue", borderColor: "blue" }}
              variant="outlined"
              onClick={generateImage}
            >
              Generate
            </Button>
          </Grid>
        </Grid>
      </Grid>
      <Grid item>
        <canvas ref={canvasRef}></canvas>
      </Grid>
    </Grid>
  );
};

export default HomePage;
