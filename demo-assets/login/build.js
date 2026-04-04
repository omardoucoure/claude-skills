// Login 1 — Demo Build Script
// Single figma_execute call creates the entire page
// Uses DSBuilders.PAGES.Demo for instant page navigation

await figma.loadFontAsync({ family: "DM Sans", style: "Medium" });
await figma.loadFontAsync({ family: "DM Sans", style: "SemiBold" });

const demoPage = await figma.getNodeByIdAsync('125:49648');
await figma.setCurrentPageAsync(demoPage);

// --- Screen Frame ---
const screen = figma.createFrame();
screen.name = 'Login 1 — Demo';
screen.resize(393, 852);
screen.fills = [{ type: 'SOLID', color: { r: 250/255, g: 250/255, b: 249/255 } }];
screen.layoutMode = 'VERTICAL';
screen.counterAxisAlignItems = 'MIN';
screen.primaryAxisSizingMode = 'FIXED';
screen.paddingLeft = 12; screen.paddingRight = 12;
screen.paddingTop = 0; screen.paddingBottom = 12;
screen.itemSpacing = 12;
screen.clipsContent = true;

// --- Status Bar ---
const statusComp = await figma.getNodeByIdAsync('85:24923');
const statusBar = statusComp.createInstance();
screen.appendChild(statusBar);
statusBar.layoutSizingHorizontal = 'FILL';

// --- Form Card (Container Card → detach) ---
const containerComp = await figma.getNodeByIdAsync('88:137854');
const formInst = containerComp.createInstance();
screen.appendChild(formInst);
formInst.layoutSizingHorizontal = 'FILL';
const formCard = formInst.detachInstance();
formCard.name = 'Form Card';
for (const c of [...formCard.children]) {
  if (c.type === 'TEXT' && (c.characters === 'Content goes here' || c.characters === 'Card Title')) c.remove();
}

// Segmented Picker (Pills)
const pickerComp = await figma.getNodeByIdAsync('85:25962');
const picker = pickerComp.createInstance();
formCard.appendChild(picker);
picker.layoutSizingHorizontal = 'FILL';
picker.fills = [{ type: 'SOLID', color: { r: 250/255, g: 250/255, b: 249/255 } }];
picker.setProperties({ 'Show 3#157:4': false, 'Show 4#157:5': false });
const tabs = picker.findAll(n => n.type === 'INSTANCE' && n.name === 'Button' && n.visible);
const tabLabels = ['Log In', 'Sign Up'];
for (let i = 0; i < tabs.length && i < 2; i++) {
  const isActive = i === 0;
  const targetComp = await figma.getNodeByIdAsync(isActive ? '85:23842' : '85:23798');
  tabs[i].swapComponent(targetComp);
  const txt = tabs[i].findOne(n => n.type === 'TEXT' && n.visible);
  if (txt) { await figma.loadFontAsync(txt.fontName); txt.characters = tabLabels[i]; if (isActive) txt.fills = [{ type: 'SOLID', color: { r: 250/255, g: 250/255, b: 249/255 } }]; }
  if (isActive) tabs[i].fills = [{ type: 'SOLID', color: { r: 37/255, g: 47/255, b: 44/255 } }];
  if (!isActive) tabs[i].fills = [{ type: 'SOLID', color: { r: 250/255, g: 250/255, b: 249/255 } }];
}

// Welcome text
const welcome = figma.createText();
welcome.fontName = { family: "DM Sans", style: "Medium" }; welcome.fontSize = 14;
welcome.characters = 'Welcome back!';
welcome.fills = [{ type: 'SOLID', color: { r: 41/255, g: 41/255, b: 39/255 } }]; welcome.opacity = 0.6;
formCard.appendChild(welcome); welcome.layoutSizingHorizontal = 'FILL';

// Title row: "Login" + logo
const titleRow = figma.createFrame();
titleRow.name = 'Title Row'; titleRow.layoutMode = 'HORIZONTAL';
titleRow.counterAxisAlignItems = 'CENTER'; titleRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
titleRow.fills = []; formCard.appendChild(titleRow);
titleRow.layoutSizingHorizontal = 'FILL'; titleRow.counterAxisSizingMode = 'AUTO';
const title = figma.createText();
title.fontName = { family: "DM Sans", style: "Medium" }; title.fontSize = 36;
title.characters = 'Login'; title.fills = [{ type: 'SOLID', color: { r: 41/255, g: 41/255, b: 39/255 } }];
titleRow.appendChild(title);
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

// Helper row: Checkbox + Forgot Password
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

// CTA Button
const ctaComp = await figma.getNodeByIdAsync('85:23698');
const cta = ctaComp.createInstance();
formCard.appendChild(cta); cta.layoutSizingHorizontal = 'FILL';
cta.setProperties({ 'Text#115:9': true, 'Button-Text#104:0': "Let's Roll!", 'Icon Right#115:34': true, 'Icon Left#115:31': false });

// --- Social Card (dark green) ---
const socialInst = containerComp.createInstance();
screen.appendChild(socialInst); socialInst.layoutSizingHorizontal = 'FILL';
const socialCard = socialInst.detachInstance();
socialCard.name = 'Social Card';
socialCard.fills = [{ type: 'SOLID', color: { r: 70/255, g: 90/255, b: 84/255 } }];
for (const c of [...socialCard.children]) {
  if (c.type === 'TEXT' && (c.characters === 'Content goes here' || c.characters === 'Card Title')) c.remove();
}

const heading = figma.createText();
heading.fontName = { family: "DM Sans", style: "Medium" }; heading.fontSize = 24;
heading.characters = 'Continue with:';
heading.fills = [{ type: 'SOLID', color: { r: 250/255, g: 250/255, b: 249/255 } }];
socialCard.appendChild(heading); heading.layoutSizingHorizontal = 'FILL';

const socialRow = figma.createFrame();
socialRow.name = 'Social Buttons'; socialRow.layoutMode = 'HORIZONTAL';
socialRow.counterAxisAlignItems = 'CENTER'; socialRow.primaryAxisAlignItems = 'MIN';
socialRow.itemSpacing = 12; socialRow.fills = [];
socialCard.appendChild(socialRow);
socialRow.layoutSizingHorizontal = 'FILL'; socialRow.counterAxisSizingMode = 'AUTO';

const neutralBigComp = await figma.getNodeByIdAsync('85:23702'); // Neutral_Big_Default
const iconIds = ['85:34182', '85:35004', '85:35009'];
const names = ['Google', 'Facebook', 'X'];
for (let i = 0; i < 3; i++) {
  const btn = neutralBigComp.createInstance(); socialRow.appendChild(btn);
  btn.name = names[i]; btn.layoutGrow = 1;
  btn.setProperties({ 'Text#115:9': false, 'Icon Right#115:34': false, 'Icon Left#115:31': true, 'Icon-Left#115:40': iconIds[i] });
}

return { id: screen.id, name: screen.name };
