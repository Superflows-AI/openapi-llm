import { useContext, useState } from "react";
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
  Text
} from "@chakra-ui/react";
import { Endpoint } from "../utils/types"
import Context from "./context";
//import AutoSizer from "react-virtualized-auto-sizer";
import classes from "./controlDynamic.module.css";

interface EndpointsByHost {
  [host: string]: Endpoint[];
}


const ControlDescription = () => {
  const context = useContext(Context);
  const [search, setSearch] = useState("");
  // Assuming that context.selectedEndpoints is an array or a Set of selected endpoint identifiers.
  const [selectedEndpoints, setSelectedEndpoints] = useState<Set<string>>(new Set());

  // This will be an array of strings representing the values of the selected checkboxes
  const selectedValues: string[] = Array.from(selectedEndpoints);

  const onCheckboxChange = (value: string) => {
    // Create a new Set from the existing one
    const newSelectedEndpoints = new Set(selectedEndpoints);
    if (newSelectedEndpoints.has(value)) {
      newSelectedEndpoints.delete(value);
    } else {
      newSelectedEndpoints.add(value);
    }
    setSelectedEndpoints(newSelectedEndpoints);
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
    
  return (
    <>
      <VStack spacing={4}>
        <Input
              placeholder="Search for endpoint..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={classes.search}
            />
        <div className={classes.wrapper}>
          
          <Heading as="h2" size="md" marginBottom="1em" marginTop="1em">
            Select Endpoints for AI Description
          </Heading>
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
                      value={selectedValues}
                      onChange={(values) => setSelectedEndpoints(new Set(values.map(value => String(value))))}
                    >
                      <VStack align="stretch" spacing={4}> {/* Adjust 'spacing' as needed */}
                        {endpoints.map((endpoint) => {
                          const endpointKey = `${endpoint.host}${endpoint.pathname}`
                          const tokenCount = context.endpointTokenCounts[endpointKey] || 0;
                          
                          return (
                          <Checkbox
                            key={`${endpoint.host}${endpoint.pathname}`}
                            value={`${endpoint.host}${endpoint.pathname}`}
                            onChange={() => onCheckboxChange(`${endpoint.host}${endpoint.pathname}`)}
                          >
                            {endpoint.pathname} | Tokens: {tokenCount}
                          </Checkbox>)
                        })}
                      </VStack>
                    </CheckboxGroup>
                  </div>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
          <Button
            mt={4} // Margin top for spacing
            colorScheme="blue"
            isDisabled={selectedEndpoints.size === 0}
            onClick={() => console.log('Describing selected endpoints...')}
          >
            Describe Endpoints
          </Button>
          </div>

        {selectedEndpoints.size === 0 && (
                    <Text mt={2} color="gray.500">
                      Identify and select endpoints to describe.
                    </Text>
                  )}
      
        </VStack>

    </>
  );
};

export default ControlDescription;


        {/* <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">Test Host</Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Checkbox value="test">Test Endpoint</Checkbox>
          </AccordionPanel>
        </AccordionItem> */}

{/* <Accordion allowMultiple>
        {hosts.map(({ host, endpoints }) => (
          <AccordionItem key={host}>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">{host}</Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel>
              <CheckboxGroup
                value={Array.from(selectedEndpoints)}
                onChange={(selectedValues) => setSelectedEndpoints(new Set(selectedValues))}
              >
                <VStack align="stretch">
                  {endpoints.map((endpoint) => (
                    <Checkbox
                      key={endpoint.id}
                      value={endpoint.id}
                      isChecked={selectedEndpoints.has(endpoint.id)}
                      onChange={() => handleEndpointSelect(host, endpoint)}
                    >
                      {endpoint.pathname}
                    </Checkbox>
                  ))}
                </VStack>
              </CheckboxGroup>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion> */}