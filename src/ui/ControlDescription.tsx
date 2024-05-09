import { useContext, useState, useEffect } from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box, 
  Button,
  Checkbox,
  CheckboxGroup,
  Heading,
  Input,
  VStack,
  Text,
  useToast
} from "@chakra-ui/react";
import { Endpoint, DescriptionStatus } from "../utils/types"
import Context from "./context";
import classes from "./controlDynamic.module.css";

interface EndpointsByHost {
  [host: string]: Endpoint[];
}


const ControlDescription = () => {
  const context = useContext(Context);
  const [apiKey, setApiKey] = useState("");
  const toast = useToast();

  // Load the API key from local storage when the component mounts
  useEffect(() => {
    const storedApiKey = localStorage.getItem('OPENAI_API_KEY');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  // Handler to update local storage when the API key changes
  const handleApiKeyChange = (newApiKey: string) => {
    localStorage.setItem('OPENAI_API_KEY', newApiKey);
    setApiKey(newApiKey);
  };

  // This will be an array of strings representing the values of the selected checkboxes
  const selectedEndpoints: string[] = Array.from(context.selectedEndpoints);

  const onCheckboxChange = (value: string) => {
    // Create a new Set from the existing one
    const newSelectedEndpoints = new Set(selectedEndpoints);
    if (newSelectedEndpoints.has(value)) {
      newSelectedEndpoints.delete(value);
    } else {
      newSelectedEndpoints.add(value);
    }
    context.setSelectedEndpoints(newSelectedEndpoints);
  };

  // Use `EndpointsByHost` to type the accumulator
  const endpointsByHost = context.endpoints.reduce((acc: EndpointsByHost, endpoint: Endpoint) => {
      const { host } = endpoint;
      if (!acc[host]) {
        acc[host] = [];
      }
      acc[host].push(endpoint);
      return acc;
    }, {} as EndpointsByHost);


  const handleDescribeEndpoints = () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter a valid OpenAI API key before proceeding.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    context.describeSelectedEndpoints(context.selectedEndpoints);
  };
    
  return (
    <>
      <VStack spacing={4} marginBottom="10em">

        <div className={classes.wrapper}>
          
          <Heading as="h2" size="md" marginBottom="1em" marginTop="1em">
            Select Endpoints for AI Description
          </Heading>
          <Text as="h2" size="sm" marginBottom="1em" marginTop="1em">
            Your OpenAI key is only ever stored locally
          </Text>
          <Input
            placeholder="Enter your OpenAI API Key..."
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            className={classes.apiKeyInput}
            marginBottom="1em"
          />

          {context.endpoints.length !== 0 && (
              <Text mt={2} color="gray.700" marginBottom="1em">
                 Click hostname to select endpoints, then click `Describe Endpoints`
              </Text>
            )}
          {context.endpoints.length === 0 && (
            <Text mt={2} color="gray.700" marginBottom="1em">
              No endpoints found. Activate endpoints in browser to start describing them.
            </Text>
          )}
            <Accordion allowMultiple>
              {Object.entries(endpointsByHost).map(([host, endpoints]) => (
                <AccordionItem key={host}>
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">{host}</Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <div className={classes.wrapper}>
                      <CheckboxGroup
                        colorScheme="green"
                        value={Array.from(context.selectedEndpoints)}
                        onChange={(values) =>
                          context.setSelectedEndpoints(new Set(values.map(value => String(value))))
                        }
                      >
                        <VStack align="stretch" spacing={4}>
                          {endpoints.map((endpoint) => {
                            const endpointKey = `${endpoint.host}${endpoint.pathname}`;
                            const tokenCount = context.endpointTokenCounts[endpointKey] || 0;
                            return (
                              <Checkbox
                                key={`${endpoint.host}${endpoint.pathname}`}
                                value={`${endpoint.host}${endpoint.pathname}`}
                                onChange={() => onCheckboxChange(`${endpoint.host}${endpoint.pathname}`)}
                              >
                                {endpoint.pathname} | Tokens: {tokenCount}
                              </Checkbox>
                            );
                          })}
                        </VStack>
                      </CheckboxGroup>
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          <Button
            mt={4}
            colorScheme="blue"
            isDisabled={(context.selectedEndpoints.size === 0 || context.descriptionsLoading === DescriptionStatus.ACTIVE)}
            onClick={handleDescribeEndpoints}
          >
            Describe Endpoints
          </Button>
          {context.descriptionsLoading === DescriptionStatus.ACTIVE && (
            <Text mt={2} color="gray.700" marginBottom="1em">
              Describing endpoints... 
            </Text>
          )}
          {context.descriptionsLoading === DescriptionStatus.COMPLETED && (
            <Text mt={2} color="gray.700" marginBottom="1em">
              Success! Check your described endpoints 
            </Text>
          )}
        </div>
      </VStack>
    </>
  );
};

export default ControlDescription;
