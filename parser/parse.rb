require 'csv'
require 'json'

class Parse
  def initialize
    @data = {}
    @data["nodes"] = []
    @data["links"] = []
  end

  def parse_for(doctor="all_doctors")
    CSV.foreach("../data/DataForVanessa.csv") do |row|
      if (row[0] == doctor || doctor == "all_doctors") && row[0] != row[3]
        sender_in_parsed_data = node_in_parsed_data(row[0])
        receiver_in_parsed_data = node_in_parsed_data(row[3])

        if sender_in_parsed_data
          sender_in_parsed_data["total_referrals"] += 1
        else
          add_node_to_parsed_data(row[0],row[1],row[2])
        end

        if receiver_in_parsed_data
          receiver_in_parsed_data["total_referrals"] += 1
        else
          add_node_to_parsed_data(row[3],row[4],row[5])
        end

        unless link_exists_in_parsed_data?(row[0],row[3])
          @data["links"] << { "source" => row[0], "target" => row[3] }
        end
      end
    end

    create_json_file(doctor)
  end

  def node_in_parsed_data(doctor)
    @data["nodes"].detect { |node| node["name"] == doctor }
  end

  def add_node_to_parsed_data(doctor,practice,specialty)
    @data["nodes"] << {"name" => doctor, "practice" => practice, "specialty" => specialty, "total_referrals" => 1}
  end

  def link_exists_in_parsed_data?(sender,receiver)
    @data["links"].any? { |link| link == { "source" => sender, "target" => receiver } }
  end

  def create_json_file(doctor)
    File.open("../data/#{doctor.split(" ").last.downcase}.json", 'w') do |file|
      file.puts JSON.pretty_generate(JSON.parse(@data.to_json))
    end
  end
end

Parse.new.parse_for("Howard Baruch")
# Parse.new.parse_for("Christine Corradino")
# Parse.new.parse_for("Mohammad Dorri")
# Parse.new.parse_for("Danielle Groves")
# Parse.new.parse_for("Danielle Zelnik")
# Parse.new.parse_for("Iris Drey")
# Parse.new.parse_for






