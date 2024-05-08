<a name="readme-top"></a>

[![MIT License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/Superflows-AI/openapi-llm">
    <img src="resources/logo.svg" alt="LLM for OpenAPI DevTool" width="300" height="250">
  </a>


  <p align="center" style="max-width: 600px;">

    Generate a OpenAPI Specification in real time for any app or website, and get the endpoints and parameters described in natural language. A browser extension that discovers API behaivour via your interactions with a product or website, and then uses an LLM to describe the API endpoints discovered.

    <br />
    <br />

    This project is a fork of OpenAPI Devtools. Check out the <a href="https://github.com/AndrewWalsh/openapi-devtools"> original tool here. </a>

    <br />
    <br />

    The <a href="https://www.superflows.ai/"> Superflows </a> team extended the functionality of the original tool after building AI assistants using OpenAPI specifications. We found it useful to have natural language descriptions in OpenAPI Specifications, both for human understanding and to increasing the reliability of AI assistants reading them. 

  </p>
  </p>
</div>

## About The Project

<p align="center" width="100%">
    <img width="80%" src="resources/demo.gif">
</p>


OpenAPI-LLM is built on top of the OpenAPI DevTools browser extension that generates OpenAPI specifications in real time from network requests. Once installed it adds a new tab to DevTools called `OpenAPI`. While the tool is open it automatically converts network requests into a specification. With the Superflows built LLM description functionality, you can then select which endpoints you would like to have a natural language descriptions for, and send the information to GPT4. The descriptions of endpoints and parameters will then be placed into the OpenAPI Specification. 

We customised this for the use case of feeding these OpenAPI Specifications to LLMs or AI agents. LLMs and AI typically require thorough descriptions of endpoints to use them well. 

*Features*:
- Instantly generate an OpenAPI 3.1 specification for any website or application just by using it
- Automatically merges new request & response headers, bodies, and query parameters per endpoint
- Click on a [path parameter](https://www.abstractapi.com/api-glossary/path-parameters) and the app will automatically merge existing and future matching requests
- View the specification inside the tool using [Redoc](https://www.npmjs.com/package/redoc) and download with a click
- Describe endpoints of your choosing and their parameters using OpenAI's GPT4

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Installation

<p align="center" width="100%">
    <img width="80%" src="resources/demo-img.png">
</p>

This version of the browser extension is not currently available in the webstores. If there is significant interest, we will add it to webstores in future.

To install manually:
  - [Download and extract the dist.zip file in the latest release](https://github.com/AndrewWalsh/openapi-devtools/releases/latest/download/dist.zip)
  - In Chrome, navigate to `chrome://extensions`
  - In the top right enable the `Developer mode` toggle
  - In the top left click `Load unpacked` and select the extracted `dist` directory
  - Open a new tab and then select `OpenAPI` in the developer tools (open with `cmd+i` or `ctrl+i`)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

The specification will automatically populate based on JSON requests that fire as you browse the web. 

In the settings menu you can enter your OpenAI API key and select which endpoints you would like to describe. Once described, the descriptions will be placed into the OpenAPI Spec next to the relevant endpoint or parameter.  

You can also filter hosts and parameterise paths in URLs. Once you do so all matching existing and future requests to that endpoint will be merged. This process is irreversible, but you can clear the specification and restart at any time.

When the same endpoint responds with different data, such as a value that is sometimes a string and sometimes null, the specification for that value will be *either* string or null. All information is accounted for in the final specification. If you see something missing from a request, trigger a request that contains the missing information.

The settings menu contains several options. Here you can enable real examples in the specification. You can also export the current state of the app as a string, share or store it, and import it later.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## What is OpenAPI?

An [OpenAPI](https://www.openapis.org/) specification is a description of what an API expects to receive and what it will respond with. It is governed by the OpenAPI Initiative and the Linux Foundation. OpenAPI specifications are the modern standard for RESTful APIs, and systems that have them are far easier to work with.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contributing

To develop the project:
- `npm install`
- `npm run dev`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[license-url]: https://github.com/AndrewWalsh/openapi-devtools/blob/main/LICENSE.txt
[license-shield]: https://img.shields.io/github/license/AndrewWalsh/openapi-devtools.svg?style=for-the-badge
[chrome-url]: https://chrome.google.com/webstore/detail/openapi-devtools/jelghndoknklgabjgaeppjhommkkmdii
[chrome-shield]: https://img.shields.io/badge/Google%20Chrome-4285F4?style=for-the-badge&logo=GoogleChrome&logoColor=white
[firefox-url]: https://addons.mozilla.org/en-US/firefox/addon/openapi-devtools/
[firefox-shield]: https://img.shields.io/badge/Firefox-FF7139?style=for-the-badge&logo=Firefox-Browser&logoColor=white