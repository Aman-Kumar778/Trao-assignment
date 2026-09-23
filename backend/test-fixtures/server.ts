import express from "express";
import http from "http";

export const fixtureApp = express();

fixtureApp.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(`
User-agent: *
Disallow: /secret
Allow: /
  `);
});

fixtureApp.get("/", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Acme Corp</title></head>
      <body>
        <h1>Welcome to Acme Corp</h1>
        <p>We build incredible AI software.</p>
        <a href="/careers">Join Our Team & Careers</a>
        <a href="/about">About Us</a>
        <a href="/secret">Secret Page</a>
      </body>
    </html>
  `);
});

fixtureApp.get("/careers", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Acme Careers</title></head>
      <body>
        <h1>Careers at Acme</h1>
        <p>Explore engineering and product roles.</p>
        <a href="/jobs/software-engineer">Senior Software Engineer</a>
        <a href="/culture">Our Culture & Values</a>
      </body>
    </html>
  `);
});

fixtureApp.get("/jobs/software-engineer", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Senior Software Engineer Job</title></head>
      <body>
        <h1>Senior Software Engineer</h1>
        <p>Requirements: 5+ years React, Node.js, System Design.</p>
      </body>
    </html>
  `);
});

fixtureApp.get("/culture", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Acme Culture</title></head>
      <body>
        <h1>Engineering Culture</h1>
        <p>We value autonomy, transparency, and rapid iteration.</p>
      </body>
    </html>
  `);
});

fixtureApp.get("/secret", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Secret Page</title></head>
      <body>
        <h1>This page should be blocked by robots.txt</h1>
      </body>
    </html>
  `);
});

export function startFixtureServer(port = 8099): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = fixtureApp.listen(port, () => {
      resolve(server);
    });
  });
}
