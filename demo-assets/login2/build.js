// Login 2 — Demo Build Script
// Single figma_execute call creates the entire page

await figma.loadFontAsync({ family: "DM Sans", style: "Medium" });
await figma.loadFontAsync({ family: "DM Sans", style: "SemiBold" });

const demoPage = await figma.getNodeByIdAsync('125:49648');
await figma.setCurrentPageAsync(demoPage);

// --- Screen Frame ---
const screen = figma.createFrame();
screen.name = 'Login 2 — Demo';
screen.resize(393, 852);
screen.fills = [{ type: 'SOLID', color: { r: 250/255, g: 250/255, b: 249/255 } }];
screen.layoutMode = 'VERTICAL';
screen.counterAxisAlignItems = 'MIN';
screen.primaryAxisSizingMode = 'FIXED';
screen.paddingLeft = 12; screen.paddingRight = 12;
screen.paddingTop = 0; screen.paddingBottom = 12;
screen.itemSpacing = 12;
screen.clipsContent = true;
screen.x = 450;

// --- Status Bar ---
const statusComp = await figma.getNodeByIdAsync('85:24923');
const statusBar = statusComp.createInstance();
screen.appendChild(statusBar);
statusBar.layoutSizingHorizontal = 'FILL';

// --- Social Section (no card wrapper) ---
const socialSection = figma.createFrame();
socialSection.name = 'Social Section';
socialSection.layoutMode = 'VERTICAL';
socialSection.counterAxisAlignItems = 'CENTER';
socialSection.itemSpacing = 16;
socialSection.paddingLeft = 20; socialSection.paddingRight = 20;
socialSection.paddingTop = 16; socialSection.paddingBottom = 8;
socialSection.fills = [];
screen.appendChild(socialSection);
socialSection.layoutSizingHorizontal = 'FILL';
socialSection.counterAxisSizingMode = 'AUTO';

const welcome = figma.createText();
welcome.fontName = { family: "DM Sans", style: "Medium" }; welcome.fontSize = 18;
welcome.characters = 'Welcome back! Log in to continue\nenjoying the Haho benefits.';
welcome.fills = [{ type: 'SOLID', color: { r: 41/255, g: 41/255, b: 39/255 } }];
welcome.textAlignHorizontal = 'CENTER';
socialSection.appendChild(welcome); welcome.layoutSizingHorizontal = 'FILL';

// Continue with Google — filledC Big, icon RIGHT
const filledCComp = await figma.getNodeByIdAsync('85:23710');
const googleBtn = filledCComp.createInstance();
socialSection.appendChild(googleBtn); googleBtn.layoutSizingHorizontal = 'FILL';
googleBtn.setProperties({ 'Text#115:9': true, 'Button-Text#104:0': 'Continue with Google', 'Icon Left#115:31': false, 'Icon Right#115:34': true, 'Icon-Right#115:37': '85:34182' });
const gVecs = googleBtn.findAll(n => (n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION'));
for (const v of gVecs) { if (v.parent?.type === 'INSTANCE') v.fills = [{ type: 'SOLID', color: { r: 250/255, g: 250/255, b: 249/255 } }]; }

// Continue with Facebook — filledC Big, icon RIGHT
const fbBtn = filledCComp.createInstance();
socialSection.appendChild(fbBtn); fbBtn.layoutSizingHorizontal = 'FILL';
fbBtn.setProperties({ 'Text#115:9': true, 'Button-Text#104:0': 'Continue with Facebook', 'Icon Left#115:31': false, 'Icon Right#115:34': true, 'Icon-Right#115:37': '85:35004' });
const fbVecs = fbBtn.findAll(n => (n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION'));
for (const v of fbVecs) { if (v.parent?.type === 'INSTANCE') v.fills = [{ type: 'SOLID', color: { r: 250/255, g: 250/255, b: 249/255 } }]; }

// --- Form Card ---
const containerComp = await figma.getNodeByIdAsync('88:137854');
const formInst = containerComp.createInstance();
screen.appendChild(formInst); formInst.layoutSizingHorizontal = 'FILL';
const formCard = formInst.detachInstance();
formCard.name = 'Form Card';
for (const c of [...formCard.children]) {
  if (c.type === 'TEXT' && (c.characters === 'Content goes here' || c.characters === 'Card Title')) c.remove();
}

// Title row: "Or better yet..." + real logo
const titleRow = figma.createFrame();
titleRow.name = 'Title Row'; titleRow.layoutMode = 'HORIZONTAL';
titleRow.counterAxisAlignItems = 'CENTER'; titleRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
titleRow.fills = []; formCard.appendChild(titleRow);
titleRow.layoutSizingHorizontal = 'FILL'; titleRow.counterAxisSizingMode = 'AUTO';
const heading = figma.createText();
heading.fontName = { family: "DM Sans", style: "Medium" }; heading.fontSize = 24;
heading.characters = 'Or better yet...';
heading.fills = [{ type: 'SOLID', color: { r: 41/255, g: 41/255, b: 39/255 } }];
titleRow.appendChild(heading);
const logoComp = await figma.getNodeByIdAsync('85:24762');
const logo = logoComp.createInstance(); logo.name = 'Logo'; logo.resize(47, 40);
titleRow.appendChild(logo);

// Email field
const emailComp = await figma.getNodeByIdAsync('85:22942');
const email = emailComp.createInstance();
formCard.appendChild(email); email.layoutSizingHorizontal = 'FILL';
email.setProperties({ 'Icon Right#159:3': true, 'Icon Left#159:9': false, 'Helper Text#159:12': false, 'Button#192:10': false, 'Icon Right#159:0': '85:33084' });
const eTexts = email.findAll(n => n.type === 'TEXT' && n.name === 'Text' && n.parent?.name === 'Text');
for (const t of eTexts) await figma.loadFontAsync(t.fontName);
if (eTexts[0]) eTexts[0].characters = 'Your Email';
if (eTexts[1]) eTexts[1].characters = 'omar@omardoucoure.com';
const eInput = email.findOne(n => n.name === 'Input' && n.type === 'FRAME');
if (eInput) eInput.fills = [{ type: 'SOLID', color: { r: 250/255, g: 250/255, b: 249/255 } }];

// Password field
const pass = emailComp.createInstance();
formCard.appendChild(pass); pass.layoutSizingHorizontal = 'FILL';
pass.setProperties({ 'Icon Right#159:3': true, 'Icon Left#159:9': false, 'Helper Text#159:12': false, 'Button#192:10': false, 'Icon Right#159:0': '85:33088' });
const pTexts = pass.findAll(n => n.type === 'TEXT' && n.name === 'Text' && n.parent?.name === 'Text');
for (const t of pTexts) await figma.loadFontAsync(t.fontName);
if (pTexts[0]) pTexts[0].characters = 'Your Password';
if (pTexts[1]) pTexts[1].characters = '••••••••••••••••••';
const pInput = pass.findOne(n => n.name === 'Input' && n.type === 'FRAME');
if (pInput) pInput.fills = [{ type: 'SOLID', color: { r: 250/255, g: 250/255, b: 249/255 } }];

// Helper row
const row = figma.createFrame();
row.name = 'Helper Row'; row.layoutMode = 'HORIZONTAL';
row.counterAxisAlignItems = 'CENTER'; row.primaryAxisAlignItems = 'SPACE_BETWEEN';
row.fills = []; formCard.appendChild(row);
row.layoutSizingHorizontal = 'FILL'; row.primaryAxisSizingMode = 'FIXED'; row.counterAxisSizingMode = 'AUTO';
const cbComp = await figma.getNodeByIdAsync('85:24850');
const cb = cbComp.createInstance(); row.appendChild(cb);
const cbFrame = cb.findOne(n => n.name === 'Checkbox' && n.type === 'FRAME');
if (cbFrame) cbFrame.strokeAlign = 'INSIDE';
const cbTexts = cb.findAll(n => n.type === 'TEXT');
for (const t of cbTexts) { await figma.loadFontAsync(t.fontName); t.characters = 'Remember me'; }
const forgotComp = await figma.getNodeByIdAsync('85:23870');
const forgot = forgotComp.createInstance(); row.appendChild(forgot);
forgot.setProperties({ 'Text#115:9': true, 'Button-Text#104:0': 'Forgot Password?', 'Icon Right#115:34': false, 'Icon Left#115:31': false });

// CTA
const ctaComp = await figma.getNodeByIdAsync('85:23698');
const cta = ctaComp.createInstance();
formCard.appendChild(cta); cta.layoutSizingHorizontal = 'FILL';
cta.setProperties({ 'Text#115:9': true, 'Button-Text#104:0': "Let's Roll!", 'Icon Right#115:34': true, 'Icon Left#115:31': false });

// Footer
const footer = figma.createText();
footer.fontName = { family: "DM Sans", style: "Medium" }; footer.fontSize = 14;
footer.characters = "Don't have an account? Sign Up";
footer.fills = [{ type: 'SOLID', color: { r: 41/255, g: 41/255, b: 39/255 } }];
footer.textAlignHorizontal = 'CENTER';
formCard.appendChild(footer); footer.layoutSizingHorizontal = 'FILL';

return { id: screen.id, name: screen.name };
