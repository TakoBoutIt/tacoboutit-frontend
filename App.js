import React, { Component } from "react";
import {
  StyleSheet,
  FlatList,
  Modal,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import RestaurantCard from './src/components/RestaurantCard/RestaurantCard';
import SplashPage from './src/components/SplashPage/SplashPage';
import { getRestaurants, newTaco } from './src/apiCalls';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import RestaurantPage from'./src/components/RestaurantPage/RestaurantPage'

export class App extends Component {
  state = {
    showModal: false,
    selectedRestaurant: null,
    restaurants: null,
    error: '',
    location: null,
    isLoading: true,
  };

  componentDidMount = async () => {
    try {
      const location = await this._getLocationAsync();
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      const restaurants = await getRestaurants(lat, lng);
      restaurants.sort((a, b) => a.distance - b.distance)
      this.setState({ restaurants, isLoading: false });
      
    } catch {
      const restaurants = await getRestaurants();
      this.setState({ error: 'Failed to get tacos by location', restaurants, isLoading: false });
    }
  }

  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        error: 'Permission to access location was denied',
      });
    }

    let location = await Location.getCurrentPositionAsync({});
    this.setState({ location });
    return location;
  };

  handlePress = (id) => {
    const selectedRestaurant = this.state.restaurants.find((rest) => rest.id === id);
    this.setState({ showModal: true, selectedRestaurant });
  }

  submitNewTaco = async (type, restaurantId) => {
    const response = await newTaco(type, restaurantId);
    if(!response.error) {
      this.updateLocalTacos(response);
    }
    return response;
  }

  updateLocalTacos = (newTaco) => {
    const localRestaurants = this.state.restaurants.map((rest) => rest);
    const restToUpdate = localRestaurants.find((rest) => rest.id === newTaco.restaurant);
    restToUpdate.tacos = [...restToUpdate.tacos, newTaco];
    this.setState({ restaurants: localRestaurants });
  }

  updateLocalReviews = (response) => {
    const newSelectedRestaurant = this.state.selectedRestaurant;
    const selectedTaco = newSelectedRestaurant.tacos.find(taco => taco.id === response.taco);
    selectedTaco.reviews.push(response)
    const restaurants = this.state.restaurants.map(rest => rest)
    let restaurantToUpdate = restaurants.find(rest => rest.id === newSelectedRestaurant.id);
    restaurantToUpdate = newSelectedRestaurant;
    this.setState({restaurants: restaurants})
  }
 
  render() {
    return (
      <LinearGradient
        colors={["#F0CB35", "#D56C2C", "#C02425"]}
        style={styles.container}
      >
        {this.state.restaurants && <FlatList data={this.state.restaurants} 
          showsVerticalScrollIndicator={false}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => <RestaurantCard
          id={item.id}
          name={item.name}
          address={item.address}
          isClosed={item.is_closed}
          distance={item.distance}
          img={item.image_url}
          handlePress={this.handlePress}
      />} />
      }
        <Modal 
          visible={this.state.showModal}
          animationType="fade"
          onRequestClose={() => {
            this.setState({ showModal: false, selectedRestaurant: null });
          }}
        >
          <RestaurantPage restaurant={this.state.selectedRestaurant} submitTaco={this.submitNewTaco} updateLocalReviews={this.updateLocalReviews}/>
        </Modal>
        {this.state.isLoading && <SplashPage isLoading={this.state.isLoading}/> }
      </LinearGradient>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: StatusBar.currentHeight,
  }
});

export default App;