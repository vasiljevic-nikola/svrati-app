import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { MapPressEvent, Marker } from "react-native-maps";

type ReminderLocation = {
  latitude: number;
  longitude: number;
};

export default function HomeScreen() {
  const [selectedLocation, setSelectedLocation] =
    useState<ReminderLocation | null>(null);

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    setSelectedLocation({
      latitude,
      longitude,
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 44.7866,
          longitude: 20.4489,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={handleMapPress}
      >
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            title="Reminder location"
            description="You selected this place"
          />
        )}
      </MapView>

      <View style={styles.header}>
        <Text style={styles.title}>Svrati</Text>

        <Text style={styles.subtitle}>
          Tap anywhere on the map to add a reminder
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  header: {
    position: "absolute",
    top: 70,
    left: 20,
    right: 20,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    padding: 20,
    borderRadius: 20,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
  },

  subtitle: {
    color: "#CBD5E1",
    fontSize: 15,
  },
});
