import figlet from "figlet";
import gradient from "gradient-string";

const fonts = [
  "Standard",
  "ANSI Shadow",
  "Big",
  "Doom",
  "Slant",
  "Small",
  "Speed",
  "Banner3-D",
];
const gradients = [
  gradient.pastel,
  gradient.cristal,
  gradient.instagram,
  gradient.mind,
  gradient.teen,
  gradient.atlas,
  gradient.rainbow,
];

export function renderLogo() {
  const font = fonts[Math.floor(Math.random() * fonts.length)];

  const text = figlet.textSync("Interview Coach", {
    font,
    horizontalLayout: "default",
  });

  const selectedGradient =
    gradients[Math.floor(Math.random() * gradients.length)];

  console.log(selectedGradient.multiline(text));
}
