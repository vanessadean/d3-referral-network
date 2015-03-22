require 'csv'
require 'json'

class SecondaryParse
  def initialize
    @data = {}
    @data["nodes"] = []
    @data["links"] = []
  end

  def parse_for(doctor, exclude=nil)
    CSV.foreach("../data/DataForVanessa.csv") do |row|
      if row[0] == doctor && row[0] != row[3] && row[4] != exclude
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
          add_link_to_parsed_data(row[0],row[3])
          parse_for(row[3], "Premier Orthopaedics")
        end
      end
    end
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

  def add_link_to_parsed_data(sender,receiver)
    @data["links"] << { "source" => sender, "target" => receiver }
  end

  def create_json_file(filename)
    File.open("../data/#{filename}.json", 'w') do |file|
      file.puts JSON.pretty_generate(JSON.parse(@data.to_json))
    end
  end
end

parser = SecondaryParse.new
parser.parse_for("Howard Baruch")
parser.create_json_file("baruch-with-secondary")


