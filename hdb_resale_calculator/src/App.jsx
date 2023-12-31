import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ChakraProvider,
  Flex,
  VStack,
  HStack,
  Heading,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import FilteredResults from './components/FilteredResults';
import History from './components/History';
import MortgageCalculator from './components/MortgageCalculator';
import HomePage from './components/Homepage';

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStreet, setSelectedStreet] = useState('');
  const [averagePrice, setAveragePrice] = useState(0);
  const [searchHistory, setSearchHistory] = useState([]);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  //this function is responsible for making API call when search term is provided 
  const handleSearch = async (term) => {
    if (term.trim()) {
      try {
        const response = await axios.get(`${backendUrl}/api/resales`, {
          params: { search: term }
        });
        setSearchResults(response.data); // Update search results with API response

        // Reset selectedStreet for new searches
        setSelectedStreet('');

        // Calculate and format the average price here for all the returned search results 
        const newAveragePrice = response.data.length
          ? response.data.reduce((sum, item) => sum + item.resale_price, 0) / response.data.length
          : 0;
        setAveragePrice(newAveragePrice); // Update average price

        // Create the search history record
        const record = {
          "Search Term": term,
          "Results Found": response.data.length.toString(),
          "Average Price": formatCurrency(newAveragePrice),
        };
        setSearchHistory(history => [...history, record]);
        // sendToAirtable(record); 
      } catch (error) {
        console.error('Error fetching search results:', error);
      }
    } else {
      setSearchResults([]);
      setAveragePrice(0); // Reset average price when search is cleared
    }
  };
 
  // Format currency without decimal
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SGD',
      maximumFractionDigits: 0,
      currencyDisplay: 'symbol'
    }).format(value);
  };

  // To handle the searches on searchbar and updates the 'searchTerm' state (see code in searchbar.jsx)
  
    // 1. The user types something into the input field in SearchBar.
    // 2. The handleInputChange function inside SearchBar is triggered by the onChange event.
    // 3. Inside handleInputChange, onSearchTermChange is called with the new input value.
    // 4. Because onSearchTermChange was passed as a prop to SearchBar and it points to handleSearchTermChange in App, it effectively calls handleSearchTermChange in the App component.
    // 5. handleSearchTermChange in App updates the searchTerm state with the new value from the input field.

  const handleSearchTermChange = (value) => {
    setSearchTerm(value);
  };

  // Extract street_names from search results
  const streetNames = Array.from(new Set(searchResults.map(item => item.street_name)));

  // To recalculate the averageprice based on the filtered street_name  whenever 'selectedStreet' or 'searchResults' changes
  // Averageprice is pass back up into app.jsx from FilteredResults.jsx
  useEffect(() => {
    // Calculate the average price based on the selected street
    const filteredResults = selectedStreet
      ? searchResults.filter(item => item.street_name === selectedStreet)
      : searchResults;
  
    const totalValue = filteredResults.reduce((sum, item) => sum + item.resale_price, 0);
    const newAveragePrice = filteredResults.length ? totalValue / filteredResults.length : 0;
    
    setAveragePrice(newAveragePrice);
  }, [searchResults, selectedStreet]); // Re-run this effect when searchResults or selectedStreet changes
  
  return (
    <ChakraProvider>
      <Router>
        <VStack>
          <Flex as="header" bg="yellow.100" w="full" justify="space-between" p={4}>
            <Heading as="h1" size="lg" ml={8}>
              Pocket Property
            </Heading>
            <HStack as="nav" spacing={4}>
              <ChakraLink as={Link} to="/" px={2} py={1}>
                Home
              </ChakraLink>
              <ChakraLink as={Link} to="/hdb-resale-data" px={2} py={1}>
                HDB Resale Data
              </ChakraLink>
              <ChakraLink as={Link} to="/history" px={2} py={1}>
                HDB Search History
              </ChakraLink>
              <ChakraLink as={Link} to="/mortgage-calculator" px={2} py={1}>
                Mortgage Calculator
              </ChakraLink>
            </HStack>
          </Flex>
          <Flex direction="column" align="center" w="full">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/hdb-resale-data" element={
                <FilteredResults
                  searchResults={searchResults}
                  selectedStreet={selectedStreet}
                  setSelectedStreet={setSelectedStreet}
                  averagePrice={averagePrice}
                  streetNames={streetNames}
                  onSearch={handleSearch}
                  onSearchTermChange={setSearchTerm}
               />
              } />
              <Route path="/history" element={<History history={searchHistory} />} />
              <Route path="/mortgage-calculator" element={<MortgageCalculator />} />
            </Routes>
          </Flex>
        </VStack>
      </Router>
    </ChakraProvider>
  );
}

export default App;





